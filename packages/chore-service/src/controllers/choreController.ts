import { Response } from 'express';
import { validationResult } from 'express-validator';
import choreService from '../services/choreService';
import { AuthRequest } from '../middleware/auth';

export const createChore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { family_id, chore_name, description, frequency, difficulty, points, room_type } = req.body;

    const result = await choreService.createChore({
      familyId: family_id,
      choreName: chore_name,
      description,
      frequency,
      difficulty,
      points,
      roomType: room_type
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignChore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { chore_id, user_id, due_date } = req.body;

    const result = await choreService.assignChore({
      choreId: chore_id,
      userId: user_id,
      dueDate: due_date
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Assign chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateChoreStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assigned_chore_id } = req.params;
    const { status } = req.body;

    const file = (req as any).file;

    const result = await choreService.updateChoreStatus({
      assignedChoreId: assigned_chore_id,
      status,
      proofImageBuffer: file?.buffer,
      proofImageName: file?.originalname,
      proofImageType: file?.mimetype
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Assigned chore not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Update chore status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChoresForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const result = await choreService.getChoresForUser(user_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get chores for user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChoresForFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const result = await choreService.getChoresForFamily(family_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get chores for family error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const result = await choreService.getPendingApprovals(family_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveChore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assigned_chore_id } = req.params;
    const result = await choreService.approveChore(assigned_chore_id);

    res.status(200).json({
      message: 'Chore approved successfully',
      pointsAwarded: result.pointsAwarded
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Assigned chore not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Approve chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectChore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assigned_chore_id } = req.params;

    const result = await choreService.updateChoreStatus({
      assignedChoreId: assigned_chore_id,
      status: 'rejected'
    });

    res.status(200).json({
      message: 'Chore rejected',
      chore: result
    });
  } catch (error) {
    console.error('Reject chore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
