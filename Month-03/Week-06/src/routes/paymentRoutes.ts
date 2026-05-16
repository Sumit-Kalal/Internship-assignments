import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase-admin.js';

import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Get all payments (Admin only)
router.get('/', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const q = query(collection(db, 'payments'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sendSuccess(res, 'Payments fetched', payments);
  } catch (err) {
    sendError(res, 'Failed to fetch payments');
  }
});

// Get user specific payments
router.get('/my-payments', authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  try {
    let userPayments: any[] = [];
    if (userRole === 'Client') {
      const clientsSnapshot = await getDocs(query(collection(db, 'clients'), where('userId', '==', userId)));
      if (!clientsSnapshot.empty) {
        const client = clientsSnapshot.docs[0];
        const snapshot = await getDocs(query(collection(db, 'payments'), where('payer_id', '==', client.id)));
        userPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } else if (userRole === 'Electrician') {
      const elecSnapshot = await getDocs(query(collection(db, 'electricians'), where('userId', '==', userId)));
      if (!elecSnapshot.empty) {
        const elec = elecSnapshot.docs[0];
        const snapshot = await getDocs(query(collection(db, 'payments'), where('receiver_id', '==', elec.id)));
        userPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    }
    sendSuccess(res, 'User payments fetched', userPayments);
  } catch (err) {
    sendError(res, 'Failed to fetch user payments');
  }
});

// Create payment order (Razorpay Mock)
router.post('/order', authenticateToken, (req, res) => {
  const { amount, job_id, type } = req.body;
  if (!amount || !job_id || !type) return sendError(res, 'Missing payment details', 400);

  const order = {
    id: `order_${uuidv4().substring(0, 8)}`,
    amount,
    currency: 'INR',
    status: 'created',
    job_id,
    type
  };
  sendSuccess(res, 'Payment order created', order);
});

// Verify payment
router.post('/verify', authenticateToken, async (req: any, res) => {
  const { 
    order_id, 
    payment_id, 
    signature, 
    amount, 
    job_id, 
    type, 
    payer_id, 
    receiver_id, 
    method,
    payer_name,
    payer_phone,
    transaction_note
  } = req.body;

  const isValid = true; 

  if (isValid) {
    try {
      const newPayment = {
        payer_id,
        receiver_id: receiver_id || 'admin',
        job_id,
        amount,
        currency: 'INR',
        payment_type: type,
        gateway: 'Razorpay',
        gateway_order_id: order_id,
        gateway_payment_id: payment_id || `pay_${uuidv4().substring(0, 8)}`,
        method: method || 'Unknown',
        payer_name: payer_name || 'System User',
        payer_phone: payer_phone || 'N/A',
        transaction_note: transaction_note || '',
        status: 'success',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'payments'), newPayment);
      
      // Update job status
      if (type === 'client_to_admin') {
        await updateDoc(doc(db, 'jobs', job_id), { status: 'Paid' });
      }
      
      sendSuccess(res, 'Payment verified and saved', newPayment);
    } catch (err) {
      console.error(err);
      sendError(res, 'Failed to save payment record');
    }
  } else {
    sendError(res, 'Invalid payment signature', 400);
  }
});

export default router;
