import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getUserPoints,
  createReward,
  getRewardsForFamily,
  redeemReward,
  getRedemptionHistory,
  getLeaderboard,
  getUserStreak,
  fulfillReward
} from '../controllers/gamificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get user points
router.get(
  '/users/:user_id/points',
  authenticateToken,
  [param('user_id').isUUID()],
  getUserPoints
);

// Get user streak
router.get(
  '/users/:user_id/streak',
  authenticateToken,
  [param('user_id').isUUID()],
  getUserStreak
);

// Get user redemption history
router.get(
  '/users/:user_id/rewards/history',
  authenticateToken,
  [param('user_id').isUUID()],
  getRedemptionHistory
);

// Create a new reward for a family
router.post(
  '/rewards',
  authenticateToken,
  [
    body('family_id').isUUID(),
    body('reward_name').trim().notEmpty(),
    body('point_cost').isInt({ min: 1 })
  ],
  createReward
);

// Get rewards for a family
router.get(
  '/families/:family_id/rewards',
  authenticateToken,
  [param('family_id').isUUID()],
  getRewardsForFamily
);

// Redeem a reward
router.post(
  '/rewards/redeem',
  authenticateToken,
  [
    body('user_id').isUUID(),
    body('reward_id').isUUID()
  ],
  redeemReward
);

// Mark reward as fulfilled
router.patch(
  '/rewards/:user_reward_id/fulfill',
  authenticateToken,
  [param('user_reward_id').isUUID()],
  fulfillReward
);

// Get family leaderboard
router.get(
  '/families/:family_id/leaderboard',
  authenticateToken,
  [param('family_id').isUUID()],
  getLeaderboard
);

export default router;
