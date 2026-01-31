import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

interface CreateFamilyInput {
  familyName: string;
  houseType: string;
  userId: string;
}

interface AddChildInput {
  familyId: string;
  firstName: string;
  nickname?: string;
  age: number;
  emoji?: string;
}

export class FamilyService {
  async createFamily(input: CreateFamilyInput) {
    const { familyName, houseType, userId } = input;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create family
      const familyId = uuidv4();
      await client.query(
        `INSERT INTO families (family_id, family_name, house_type, created_by)
         VALUES ($1, $2, $3, $4)`,
        [familyId, familyName, houseType, userId]
      );

      // Update user with family_id
      await client.query(
        'UPDATE users SET family_id = $1 WHERE user_id = $2',
        [familyId, userId]
      );

      // Add user as family member
      await client.query(
        `INSERT INTO family_members (family_id, user_id, role)
         VALUES ($1, $2, 'parent')`,
        [familyId, userId]
      );

      await client.query('COMMIT');

      return {
        familyId,
        familyName
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addChild(input: AddChildInput) {
    const { familyId, firstName, nickname, age, emoji } = input;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create user for child
      const userId = uuidv4();
      await client.query(
        `INSERT INTO users (user_id, first_name, role, family_id, age, emoji)
         VALUES ($1, $2, 'child', $3, $4, $5)`,
        [userId, firstName, familyId, age, emoji || null]
      );

      // Add as family member
      await client.query(
        `INSERT INTO family_members (family_id, user_id, role, nickname)
         VALUES ($1, $2, 'child', $3)`,
        [familyId, userId, nickname || firstName]
      );

      await client.query('COMMIT');

      return {
        userId,
        firstName,
        nickname: nickname || firstName
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getFamilyDetails(familyId: string) {
    // Get family info
    const familyResult = await pool.query(
      'SELECT family_id, family_name, house_type FROM families WHERE family_id = $1',
      [familyId]
    );

    if (familyResult.rows.length === 0) {
      throw new Error('Family not found');
    }

    const family = familyResult.rows[0];

    // Get family members
    const membersResult = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.role, u.age, fm.nickname
       FROM users u
       JOIN family_members fm ON u.user_id = fm.user_id
       WHERE fm.family_id = $1`,
      [familyId]
    );

    return {
      familyId: family.family_id,
      familyName: family.family_name,
      houseType: family.house_type,
      members: membersResult.rows.map(member => ({
        userId: member.user_id,
        firstName: member.first_name,
        lastName: member.last_name,
        nickname: member.nickname,
        role: member.role,
        age: member.age
      }))
    };
  }

  async updateHouseDetails(familyId: string, houseDetails: object) {
    await pool.query(
      'UPDATE families SET house_details = $1 WHERE family_id = $2',
      [JSON.stringify(houseDetails), familyId]
    );
  }
}

export default new FamilyService();
