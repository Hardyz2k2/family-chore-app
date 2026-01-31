import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  processVoiceSetup,
  processHouseScan,
  generateChores,
  distributeChores
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Voice setup endpoint
router.post(
  '/ai/voice-setup',
  authenticateToken,
  [
    body('text_input').trim().notEmpty()
  ],
  processVoiceSetup
);

// House scan endpoint
router.post(
  '/ai/house-scan',
  authenticateToken,
  [
    body('family_id').isUUID(),
    body('detected_objects').isArray()
  ],
  processHouseScan
);

// Generate chores based on house scan
router.get(
  '/ai/families/:family_id/generate-chores',
  authenticateToken,
  [param('family_id').isUUID()],
  generateChores
);

// Distribute chores to family members
router.post(
  '/ai/families/:family_id/distribute-chores',
  authenticateToken,
  [param('family_id').isUUID()],
  distributeChores
);

export default router;
