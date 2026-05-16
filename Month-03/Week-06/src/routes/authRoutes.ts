import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-admin.js';
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
  
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const usersSnapshot = await getDocs(q);
    
    if (usersSnapshot.empty) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;

    if (!bcrypt.compareSync(password, user.password)) {
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
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
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

  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const usersSnapshot = await getDocs(q);
    
    if (!usersSnapshot.empty) {
      return sendError(res, 'Email already exists', 400);
    }

    const newUser = {
      email,
      password: bcrypt.hashSync(password, 10),
      role,
      name,
      created_at: new Date().toISOString()
    };

    const userDocRef = await addDoc(collection(db, 'users'), newUser);
    const userId = userDocRef.id;

    // If role is Client, create a client profile
    if (role === 'Client') {
      await addDoc(collection(db, 'clients'), {
        userId,
        name,
        company: '',
        phone: '',
        address: ''
      });
    } else if (role === 'Electrician') {
      await addDoc(collection(db, 'electricians'), {
        userId,
        name,
        level: 'Apprentice',
        status: 'Active',
        availability: 'Available'
      });
    }

    const token = jwt.sign(
      { id: userId, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    sendSuccess(res, 'Registration successful', {
      token,
      user: { id: userId, email: newUser.email, role: newUser.role, name: newUser.name }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed', 500);
  }
});

export default router;
