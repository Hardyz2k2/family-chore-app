import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { uploadToS3 } from '../config/s3';

interface CreateChoreInput {
  familyId: string;
  choreName: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  roomType?: string;
}

interface AssignChoreInput {
  choreId: string;
  userId: string;
  dueDate: string;
}

interface UpdateStatusInput {
  assignedChoreId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  proofImageBuffer?: Buffer;
  proofImageName?: string;
  proofImageType?: string;
}

export class ChoreService {
  async createChore(input: CreateChoreInput) {
    const { familyId, choreName, description, frequency, difficulty, points, roomType } = input;
    const choreId = uuidv4();

    const result = await pool.query(
      `INSERT INTO chores (chore_id, family_id, chore_name, description, frequency, difficulty, points, room_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [choreId, familyId, choreName, description || null, frequency, difficulty, points, roomType || null]
    );

    return result.rows[0];
  }

  async assignChore(input: AssignChoreInput) {
    const { choreId, userId, dueDate } = input;
    const assignedChoreId = uuidv4();

    const result = await pool.query(
      `INSERT INTO assigned_chores (assigned_chore_id, chore_id, user_id, due_date, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [assignedChoreId, choreId, userId, dueDate]
    );

    return result.rows[0];
  }

  async updateChoreStatus(input: UpdateStatusInput) {
    const { assignedChoreId, status, proofImageBuffer, proofImageName, proofImageType } = input;

    let proofImageUrl: string | null = null;

    if (proofImageBuffer && proofImageName && proofImageType) {
      proofImageUrl = await uploadToS3(proofImageBuffer, proofImageName, proofImageType);
    }

    const updateFields = ['status = $1'];
    const values: any[] = [status];
    let paramIndex = 2;

    if (proofImageUrl) {
      updateFields.push(`proof_image_url = $${paramIndex}`);
      values.push(proofImageUrl);
      paramIndex++;
    }

    if (status === 'completed') {
      updateFields.push(`completed_at = NOW()`);
    }

    values.push(assignedChoreId);

    const result = await pool.query(
      `UPDATE assigned_chores
       SET ${updateFields.join(', ')}
       WHERE assigned_chore_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Assigned chore not found');
    }

    return result.rows[0];
  }

  async getChoresForUser(userId: string) {
    const result = await pool.query(
      `SELECT ac.*, c.chore_name, c.description, c.points, c.difficulty
       FROM assigned_chores ac
       JOIN chores c ON ac.chore_id = c.chore_id
       WHERE ac.user_id = $1
       ORDER BY ac.due_date ASC`,
      [userId]
    );

    return result.rows;
  }

  async getChoresForFamily(familyId: string) {
    const result = await pool.query(
      `SELECT * FROM chores WHERE family_id = $1`,
      [familyId]
    );

    return result.rows;
  }

  async getPendingApprovals(familyId: string) {
    const result = await pool.query(
      `SELECT ac.*, c.chore_name, c.points, u.first_name
       FROM assigned_chores ac
       JOIN chores c ON ac.chore_id = c.chore_id
       JOIN users u ON ac.user_id = u.user_id
       WHERE c.family_id = $1 AND ac.status = 'completed'
       ORDER BY ac.completed_at DESC`,
      [familyId]
    );

    return result.rows;
  }

  async approveChore(assignedChoreId: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the chore details
      const choreResult = await client.query(
        `SELECT ac.user_id, c.points
         FROM assigned_chores ac
         JOIN chores c ON ac.chore_id = c.chore_id
         WHERE ac.assigned_chore_id = $1`,
        [assignedChoreId]
      );

      if (choreResult.rows.length === 0) {
        throw new Error('Assigned chore not found');
      }

      const { user_id, points } = choreResult.rows[0];

      // Update chore status
      await client.query(
        `UPDATE assigned_chores SET status = 'approved', approved_at = NOW()
         WHERE assigned_chore_id = $1`,
        [assignedChoreId]
      );

      // Award points to user
      await client.query(
        `UPDATE users SET points = COALESCE(points, 0) + $1 WHERE user_id = $2`,
        [points, user_id]
      );

      await client.query('COMMIT');

      return { userId: user_id, pointsAwarded: points };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getChoreById(choreId: string) {
    const result = await pool.query(
      `SELECT * FROM chores WHERE chore_id = $1`,
      [choreId]
    );

    if (result.rows.length === 0) {
      throw new Error('Chore not found');
    }

    return result.rows[0];
  }

  async deleteChore(choreId: string) {
    await pool.query('DELETE FROM chores WHERE chore_id = $1', [choreId]);
  }
}

export default new ChoreService();
