import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/authService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, first_name, last_name } = req.body;
    const result = await authService.register({
      email,
      password,
      firstName: first_name,
      lastName: last_name
    });

    res.status(201).json({
      user_id: result.userId,
      email: result.email,
      token: result.token
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.status(200).json({
      user_id: result.userId,
      email: result.email,
      token: result.token
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({ error: error.message });
        return;
      }
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await authService.getUserById(userId);
    res.status(200).json({
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      family_id: user.family_id
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
