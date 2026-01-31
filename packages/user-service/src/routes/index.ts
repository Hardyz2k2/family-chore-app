import { Router } from 'express';
import { body, param } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController';
import { createFamily, addChild, getFamilyDetails, updateHouseDetails } from '../controllers/familyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth routes
router.post(
  '/auth/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty()
  ],
  register
);

router.post(
  '/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  login
);

router.get('/auth/profile', authenticateToken, getProfile);

// Family routes
router.post(
  '/families',
  authenticateToken,
  [
    body('family_name').trim().notEmpty(),
    body('house_type').trim().notEmpty()
  ],
  createFamily
);

router.post(
  '/families/:family_id/members',
  authenticateToken,
  [
    param('family_id').isUUID(),
    body('first_name').trim().notEmpty(),
    body('age').isInt({ min: 1, max: 18 })
  ],
  addChild
);

router.get(
  '/families/:family_id',
  authenticateToken,
  [param('family_id').isUUID()],
  getFamilyDetails
);

router.patch(
  '/families/:family_id/house',
  authenticateToken,
  [
    param('family_id').isUUID(),
    body('house_details').isObject()
  ],
  updateHouseDetails
);

export default router;
