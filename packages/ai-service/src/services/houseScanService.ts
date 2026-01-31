import pool from '../config/database';

interface DetectedObject {
  object: string;
  confidence: number;
  roomType?: string;
}

interface RoomData {
  roomType: string;
  assets: string[];
}

interface HouseDetails {
  rooms: RoomData[];
}

export class HouseScanService {
  // Map common objects to chores
  private objectToChores: Record<string, string[]> = {
    'dishwasher': ['Load dishwasher', 'Unload dishwasher'],
    'refrigerator': ['Clean refrigerator', 'Organize fridge'],
    'oven': ['Clean oven', 'Wipe stovetop'],
    'sink': ['Wash dishes', 'Clean sink'],
    'bed': ['Make bed', 'Change sheets'],
    'toilet': ['Clean toilet', 'Scrub bathroom'],
    'bathtub': ['Clean bathtub', 'Wipe bathroom surfaces'],
    'couch': ['Vacuum couch', 'Fluff cushions'],
    'tv': ['Dust entertainment center', 'Organize cables'],
    'table': ['Set table', 'Clear table', 'Wipe table'],
    'chair': ['Push in chairs', 'Wipe down chairs'],
    'carpet': ['Vacuum carpet', 'Steam clean carpet'],
    'window': ['Clean windows', 'Dust window sills'],
    'plant': ['Water plants', 'Prune plants'],
    'dog': ['Feed dog', 'Walk dog', 'Brush dog'],
    'cat': ['Feed cat', 'Clean litter box', 'Brush cat'],
    'trash_can': ['Take out trash', 'Replace trash bag'],
    'laundry_basket': ['Do laundry', 'Fold clothes', 'Put away clothes'],
    'bookshelf': ['Dust bookshelf', 'Organize books']
  };

  // Chore difficulty by age
  private choreAgeMap: Record<string, { difficulty: string; minAge: number }> = {
    'Make bed': { difficulty: 'easy', minAge: 4 },
    'Set table': { difficulty: 'easy', minAge: 5 },
    'Clear table': { difficulty: 'easy', minAge: 5 },
    'Water plants': { difficulty: 'easy', minAge: 5 },
    'Feed dog': { difficulty: 'easy', minAge: 6 },
    'Feed cat': { difficulty: 'easy', minAge: 6 },
    'Push in chairs': { difficulty: 'easy', minAge: 4 },
    'Fluff cushions': { difficulty: 'easy', minAge: 5 },
    'Put away clothes': { difficulty: 'easy', minAge: 5 },
    'Take out trash': { difficulty: 'medium', minAge: 8 },
    'Load dishwasher': { difficulty: 'medium', minAge: 8 },
    'Unload dishwasher': { difficulty: 'medium', minAge: 7 },
    'Vacuum carpet': { difficulty: 'medium', minAge: 8 },
    'Wipe table': { difficulty: 'easy', minAge: 6 },
    'Dust bookshelf': { difficulty: 'easy', minAge: 7 },
    'Clean sink': { difficulty: 'medium', minAge: 9 },
    'Fold clothes': { difficulty: 'medium', minAge: 8 },
    'Walk dog': { difficulty: 'medium', minAge: 10 },
    'Do laundry': { difficulty: 'hard', minAge: 12 },
    'Clean toilet': { difficulty: 'hard', minAge: 12 },
    'Clean oven': { difficulty: 'hard', minAge: 14 },
    'Clean bathtub': { difficulty: 'hard', minAge: 12 },
    'Steam clean carpet': { difficulty: 'hard', minAge: 14 }
  };

  async processHouseScan(familyId: string, detectedObjects: DetectedObject[]) {
    // Aggregate objects by room
    const roomsMap = new Map<string, Set<string>>();

    for (const obj of detectedObjects) {
      const roomType = obj.roomType || 'general';
      if (!roomsMap.has(roomType)) {
        roomsMap.set(roomType, new Set());
      }
      if (obj.confidence > 0.7) {
        roomsMap.get(roomType)!.add(obj.object);
      }
    }

    const houseDetails: HouseDetails = {
      rooms: Array.from(roomsMap.entries()).map(([roomType, assets]) => ({
        roomType,
        assets: Array.from(assets)
      }))
    };

    // Save house details
    await pool.query(
      'UPDATE families SET house_details = $1 WHERE family_id = $2',
      [JSON.stringify(houseDetails), familyId]
    );

    return houseDetails;
  }

  async generateChoresFromScan(familyId: string) {
    // Get house details
    const familyResult = await pool.query(
      'SELECT house_details FROM families WHERE family_id = $1',
      [familyId]
    );

    if (familyResult.rows.length === 0) {
      throw new Error('Family not found');
    }

    const houseDetails: HouseDetails = familyResult.rows[0].house_details || { rooms: [] };
    const suggestedChores: Array<{
      choreName: string;
      roomType: string;
      difficulty: string;
      minAge: number;
      points: number;
    }> = [];

    // Generate chores based on detected objects
    for (const room of houseDetails.rooms) {
      for (const asset of room.assets) {
        const chores = this.objectToChores[asset.toLowerCase()] || [];
        for (const choreName of chores) {
          const choreInfo = this.choreAgeMap[choreName] || { difficulty: 'medium', minAge: 8 };
          const points = choreInfo.difficulty === 'easy' ? 10 :
                        choreInfo.difficulty === 'medium' ? 20 : 30;

          suggestedChores.push({
            choreName,
            roomType: room.roomType,
            difficulty: choreInfo.difficulty,
            minAge: choreInfo.minAge,
            points
          });
        }
      }
    }

    // Remove duplicates
    const uniqueChores = Array.from(
      new Map(suggestedChores.map(c => [c.choreName, c])).values()
    );

    return uniqueChores;
  }

  async distributeChores(familyId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get family children
      const childrenResult = await client.query(
        `SELECT u.user_id, u.age, u.first_name
         FROM users u
         JOIN family_members fm ON u.user_id = fm.user_id
         WHERE fm.family_id = $1 AND u.role = 'child'`,
        [familyId]
      );

      // Get family chores
      const choresResult = await client.query(
        'SELECT * FROM chores WHERE family_id = $1',
        [familyId]
      );

      const children = childrenResult.rows;
      const chores = choresResult.rows;

      if (children.length === 0 || chores.length === 0) {
        await client.query('COMMIT');
        return { message: 'No children or chores to distribute' };
      }

      // Calculate age-appropriate chores for each child
      const assignments: Array<{ choreId: string; userId: string; dueDate: Date }> = [];
      const today = new Date();
      const weekDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday

      for (const child of children) {
        // Get chores this child can do based on age
        const eligibleChores = chores.filter((chore: any) => {
          const choreInfo = this.choreAgeMap[chore.chore_name];
          const minAge = choreInfo?.minAge || 8;
          return child.age >= minAge;
        });

        // Distribute chores across the week
        let choreIndex = 0;
        for (const dayOffset of weekDays) {
          if (eligibleChores.length === 0) break;

          const dueDate = new Date(today);
          dueDate.setDate(today.getDate() + dayOffset);

          // Assign 1-2 chores per day
          const dailyChores = eligibleChores.slice(choreIndex, choreIndex + 2);
          for (const chore of dailyChores) {
            assignments.push({
              choreId: chore.chore_id,
              userId: child.user_id,
              dueDate
            });
          }
          choreIndex = (choreIndex + 2) % eligibleChores.length;
        }
      }

      // Create assignments in database
      for (const assignment of assignments) {
        const assignedChoreId = require('uuid').v4();
        await client.query(
          `INSERT INTO assigned_chores (assigned_chore_id, chore_id, user_id, due_date, status)
           VALUES ($1, $2, $3, $4, 'pending')
           ON CONFLICT DO NOTHING`,
          [assignedChoreId, assignment.choreId, assignment.userId, assignment.dueDate]
        );
      }

      await client.query('COMMIT');

      return {
        message: 'Chores distributed successfully',
        assignmentsCreated: assignments.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new HouseScanService();
