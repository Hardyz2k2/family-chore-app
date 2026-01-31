import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

interface CreateRewardInput {
  familyId: string;
  rewardName: string;
  description?: string;
  pointCost: number;
}

interface RedeemRewardInput {
  userId: string;
  rewardId: string;
}

export class GamificationService {
  async getUserPoints(userId: string) {
    const result = await pool.query(
      'SELECT user_id, COALESCE(points, 0) as points FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      userId: result.rows[0].user_id,
      points: result.rows[0].points
    };
  }

  async awardPoints(userId: string, points: number, reason: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update user points
      await client.query(
        'UPDATE users SET points = COALESCE(points, 0) + $1 WHERE user_id = $2',
        [points, userId]
      );

      // Log the points transaction
      await client.query(
        `INSERT INTO points_history (history_id, user_id, points, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), userId, points, reason]
      );

      await client.query('COMMIT');

      // Return updated balance
      const result = await pool.query(
        'SELECT COALESCE(points, 0) as points FROM users WHERE user_id = $1',
        [userId]
      );

      return {
        userId,
        newBalance: result.rows[0].points,
        pointsAwarded: points
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createReward(input: CreateRewardInput) {
    const { familyId, rewardName, description, pointCost } = input;
    const rewardId = uuidv4();

    const result = await pool.query(
      `INSERT INTO rewards (reward_id, family_id, reward_name, description, point_cost)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [rewardId, familyId, rewardName, description || null, pointCost]
    );

    return result.rows[0];
  }

  async getRewardsForFamily(familyId: string) {
    const result = await pool.query(
      'SELECT * FROM rewards WHERE family_id = $1 AND is_active = true ORDER BY point_cost ASC',
      [familyId]
    );

    return result.rows;
  }

  async redeemReward(input: RedeemRewardInput) {
    const { userId, rewardId } = input;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get reward details
      const rewardResult = await client.query(
        'SELECT * FROM rewards WHERE reward_id = $1 AND is_active = true',
        [rewardId]
      );

      if (rewardResult.rows.length === 0) {
        throw new Error('Reward not found or inactive');
      }

      const reward = rewardResult.rows[0];

      // Get user points
      const userResult = await client.query(
        'SELECT COALESCE(points, 0) as points FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentPoints = userResult.rows[0].points;

      if (currentPoints < reward.point_cost) {
        throw new Error('Insufficient points');
      }

      // Deduct points
      const newBalance = currentPoints - reward.point_cost;
      await client.query(
        'UPDATE users SET points = $1 WHERE user_id = $2',
        [newBalance, userId]
      );

      // Record redemption
      const redemptionId = uuidv4();
      await client.query(
        `INSERT INTO user_rewards (user_reward_id, user_id, reward_id, redeemed_at, status)
         VALUES ($1, $2, $3, NOW(), 'pending')`,
        [redemptionId, userId, rewardId]
      );

      // Log points transaction
      await client.query(
        `INSERT INTO points_history (history_id, user_id, points, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), userId, -reward.point_cost, `Redeemed: ${reward.reward_name}`]
      );

      await client.query('COMMIT');

      return {
        message: 'Reward redeemed successfully!',
        rewardName: reward.reward_name,
        newPointBalance: newBalance
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRedemptionHistory(userId: string) {
    const result = await pool.query(
      `SELECT ur.*, r.reward_name, r.point_cost
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_id = r.reward_id
       WHERE ur.user_id = $1
       ORDER BY ur.redeemed_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getLeaderboard(familyId: string) {
    const result = await pool.query(
      `SELECT u.user_id, u.first_name, fm.nickname, COALESCE(u.points, 0) as points
       FROM users u
       JOIN family_members fm ON u.user_id = fm.user_id
       WHERE fm.family_id = $1 AND u.role = 'child'
       ORDER BY u.points DESC`,
      [familyId]
    );

    return result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      name: row.nickname || row.first_name,
      points: row.points
    }));
  }

  async getUserStreak(userId: string) {
    // Calculate current streak based on consecutive days with completed chores
    const result = await pool.query(
      `WITH daily_completions AS (
        SELECT DISTINCT DATE(completed_at) as completion_date
        FROM assigned_chores
        WHERE user_id = $1 AND status = 'approved'
        ORDER BY completion_date DESC
      )
      SELECT COUNT(*) as streak
      FROM (
        SELECT completion_date,
               completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::int as grp
        FROM daily_completions
        WHERE completion_date >= CURRENT_DATE - INTERVAL '30 days'
      ) sub
      WHERE grp = (SELECT MAX(grp) FROM (
        SELECT completion_date,
               completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::int as grp
        FROM daily_completions
        WHERE completion_date >= CURRENT_DATE - INTERVAL '30 days'
      ) sub2
      WHERE completion_date >= CURRENT_DATE - INTERVAL '1 day')`,
      [userId]
    );

    return {
      userId,
      currentStreak: parseInt(result.rows[0]?.streak || '0')
    };
  }

  async fulfillReward(userRewardId: string) {
    await pool.query(
      `UPDATE user_rewards SET status = 'fulfilled', fulfilled_at = NOW()
       WHERE user_reward_id = $1`,
      [userRewardId]
    );
  }
}

export default new GamificationService();
