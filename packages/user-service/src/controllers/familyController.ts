import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import familyService from '../services/familyService';
import { AuthRequest } from '../middleware/auth';

export const createFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { family_name, house_type } = req.body;
    const result = await familyService.createFamily({
      familyName: family_name,
      houseType: house_type,
      userId
    });

    res.status(201).json({
      family_id: result.familyId,
      family_name: result.familyName
    });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addChild = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { family_id } = req.params;
    const { first_name, nickname, age, emoji } = req.body;

    const result = await familyService.addChild({
      familyId: family_id,
      firstName: first_name,
      nickname,
      age,
      emoji
    });

    res.status(201).json({
      user_id: result.userId,
      first_name: result.firstName,
      nickname: result.nickname
    });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFamilyDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const result = await familyService.getFamilyDetails(family_id);

    res.status(200).json({
      family_id: result.familyId,
      family_name: result.familyName,
      members: result.members.map(member => ({
        user_id: member.userId,
        first_name: member.firstName,
        nickname: member.nickname,
        role: member.role,
        age: member.age
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Family not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Get family details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateHouseDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;
    const { house_details } = req.body;

    await familyService.updateHouseDetails(family_id, house_details);

    res.status(200).json({ message: 'House details updated successfully' });
  } catch (error) {
    console.error('Update house details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
