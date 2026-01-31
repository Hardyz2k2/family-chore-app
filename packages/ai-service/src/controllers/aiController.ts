import { Response } from 'express';
import { validationResult } from 'express-validator';
import voiceSetupService from '../services/voiceSetupService';
import houseScanService from '../services/houseScanService';
import { AuthRequest } from '../middleware/auth';

export const processVoiceSetup = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { session_id, text_input } = req.body;

    const result = await voiceSetupService.processVoiceInput(session_id, text_input, userId);

    res.status(200).json({
      session_id: result.sessionId,
      action: result.action,
      extracted_data: result.extractedData,
      response_text: result.responseText,
      is_complete: result.isComplete
    });
  } catch (error) {
    console.error('Voice setup error:', error);
    res.status(500).json({ error: 'Failed to process voice input' });
  }
};

export const processHouseScan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id, detected_objects } = req.body;

    if (!family_id || !detected_objects) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const houseDetails = await houseScanService.processHouseScan(family_id, detected_objects);

    res.status(200).json({
      house_details: houseDetails
    });
  } catch (error) {
    console.error('House scan error:', error);
    res.status(500).json({ error: 'Failed to process house scan' });
  }
};

export const generateChores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;

    const suggestedChores = await houseScanService.generateChoresFromScan(family_id);

    res.status(200).json({
      suggested_chores: suggestedChores
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Family not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Generate chores error:', error);
    res.status(500).json({ error: 'Failed to generate chores' });
  }
};

export const distributeChores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { family_id } = req.params;

    const result = await houseScanService.distributeChores(family_id);

    res.status(200).json(result);
  } catch (error) {
    console.error('Distribute chores error:', error);
    res.status(500).json({ error: 'Failed to distribute chores' });
  }
};
