import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { store } from '../models/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { JWT_CONFIG } from '../config/config.js';

const router = express.Router();

/**
 * User Authentication Endpoint
 * Validates credentials against stored users and issues JWT token
 * Token is valid for 24 hours
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required for authentication')
], async (req: any, res: any) => {
  // Validate input format
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;

  // Look up user by email
  const user = store.users.find(u => u.email === email);

  // Verify password using bcrypt (constant-time comparison)
  const isValidPassword = user && bcrypt.compareSync(password, user.password);
  if (!user || !isValidPassword) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Generate JWT token with user claims
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_CONFIG.SECRET,
    { expiresIn: JWT_CONFIG.EXPIRES_IN }
  );

  // Return token and user profile (password excluded)
  sendSuccess(res, 'Login successful', {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }
  });
});

export default router;
