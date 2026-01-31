import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
}

export class AuthService {
  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
  }

  async register(input: RegisterInput): Promise<UserResponse> {
    const { email, password, firstName, lastName } = input;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (user_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, 'parent')
       RETURNING user_id, email, first_name, last_name, role`,
      [userId, email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];
    const token = this.generateToken(user.user_id, user.email, user.role);

    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      token
    };
  }

  async login(input: LoginInput): Promise<UserResponse> {
    const { email, password } = input;

    // Find user
    const result = await pool.query(
      'SELECT user_id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.user_id, user.email, user.role);

    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      token
    };
  }

  async getUserById(userId: string) {
    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, role, family_id FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

export default new AuthService();
