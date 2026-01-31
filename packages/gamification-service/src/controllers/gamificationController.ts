import { Response } from 'express';
import { validationResult } from 'express-validator';
import gamificationService from '../services/gamificationService';
import { AuthRequest } from '../middleware/auth';

export const getUserPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const result = await gamificationService.getUserPoints(user_id);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Get user points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { family_id, reward_name, description, point_cost } = req.body;

    const result = await gamificationService.createReward({
      familyId: family_id,
      rewardName: reward_name,
      description,
      pointCost: point_cost
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRewardsForFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const result = await gamificationService.getRewardsForFamily(family_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const redeemReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { user_id, reward_id } = req.body;

    const result = await gamificationService.redeemReward({
      userId: user_id,
      rewardId: reward_id
    });

    res.status(200).json({
      message: result.message,
      new_point_balance: result.newPointBalance
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Insufficient points') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'Reward not found or inactive' || error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
    }
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRedemptionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const result = await gamificationService.getRedemptionHistory(user_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const result = await gamificationService.getLeaderboard(family_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserStreak = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const result = await gamificationService.getUserStreak(user_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get user streak error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const fulfillReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_reward_id } = req.params;
    await gamificationService.fulfillReward(user_reward_id);

    res.status(200).json({ message: 'Reward marked as fulfilled' });
  } catch (error) {
    console.error('Fulfill reward error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
