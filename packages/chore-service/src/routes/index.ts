import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import {
  createChore,
  assignChore,
  updateChoreStatus,
  getChoresForUser,
  getChoresForFamily,
  getPendingApprovals,
  approveChore,
  rejectChore
} from '../controllers/choreController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a new chore
router.post(
  '/chores',
  authenticateToken,
  [
    body('family_id').isUUID(),
    body('chore_name').trim().notEmpty(),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'once']),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('points').isInt({ min: 1 })
  ],
  createChore
);

// Assign a chore to a user
router.post(
  '/chores/assign',
  authenticateToken,
  [
    body('chore_id').isUUID(),
    body('user_id').isUUID(),
    body('due_date').isISO8601()
  ],
  assignChore
);

// Update chore status (with optional proof image)
router.patch(
  '/chores/assigned/:assigned_chore_id',
  authenticateToken,
  upload.single('proof_image'),
  [
    param('assigned_chore_id').isUUID(),
    body('status').isIn(['pending', 'in_progress', 'completed', 'approved', 'rejected'])
  ],
  updateChoreStatus
);

// Get chores for a specific user
router.get(
  '/users/:user_id/chores',
  authenticateToken,
  [param('user_id').isUUID()],
  getChoresForUser
);

// Get all chores for a family
router.get(
  '/families/:family_id/chores',
  authenticateToken,
  [param('family_id').isUUID()],
  getChoresForFamily
);

// Get pending approvals for a family
router.get(
  '/families/:family_id/approvals',
  authenticateToken,
  [param('family_id').isUUID()],
  getPendingApprovals
);

// Approve a completed chore
router.post(
  '/chores/assigned/:assigned_chore_id/approve',
  authenticateToken,
  [param('assigned_chore_id').isUUID()],
  approveChore
);

// Reject a completed chore
router.post(
  '/chores/assigned/:assigned_chore_id/reject',
  authenticateToken,
  [param('assigned_chore_id').isUUID()],
  rejectChore
);

export default router;
