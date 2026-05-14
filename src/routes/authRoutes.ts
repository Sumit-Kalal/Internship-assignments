import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { store } from '../models/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;
  const user = store.users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return sendError(res, 'Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  sendSuccess(res, 'Login successful', {
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
});

router.post('/register', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['Client', 'Electrician']).withMessage('Invalid role')
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { email, password, name, role } = req.body;
  if (store.users.find(u => u.email === email)) {
    return sendError(res, 'Email already exists', 400);
  }

  const userId = Date.now().toString();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, 10),
    role,
    name
  };

  store.users.push(newUser);

  // If role is Client, create a client profile
  if (role === 'Client') {
    store.clients.push({
      id: `c_${Date.now()}`,
      userId,
      name,
      company: '',
      phone: ''
    });
  } else if (role === 'Electrician') {
    store.electricians.push({
      id: `e_${Date.now()}`,
      userId,
      name,
      level: 'Apprentice',
      status: 'Active',
      availability: 'Available'
    });
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  sendSuccess(res, 'Registration successful', {
    token,
    user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }
  }, 201);
});

export default router;
