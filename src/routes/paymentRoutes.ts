import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { store } from '../models/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// Get all payments (Admin only)
router.get('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  sendSuccess(res, 'Payments fetched', store.payments);
});

// Get user specific payments
router.get('/my-payments', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  let userPayments = [];
  if (userRole === 'Client') {
    const client = store.clients.find(c => c.userId === userId);
    userPayments = store.payments.filter(p => p.payer_id === client?.id);
  } else if (userRole === 'Electrician') {
    const elec = store.electricians.find(e => e.userId === userId);
    userPayments = store.payments.filter(p => p.receiver_id === elec?.id);
  }
  
  sendSuccess(res, 'User payments fetched', userPayments);
});

// Create payment order (Razorpay Mock)
router.post('/order', authenticateToken, (req, res) => {
  const { amount, job_id, type } = req.body;
  
  if (!amount || !job_id || !type) {
    return sendError(res, 'Missing payment details', 400);
  }

  // In a real Razorpay integration, you'd call:
  // instance.orders.create({ amount: amount * 100, currency: "INR", receipt: "receipt#1" })
  
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
router.post('/verify', authenticateToken, (req: any, res) => {
  const { order_id, payment_id, signature, amount, job_id, job_title, type, payer_id, payer_name, receiver_id, receiver_name } = req.body;

  // In real case, verify signature with crypto hmac
  const isValid = true; 

  if (isValid) {
    let resolvedJobId = job_id;
    let resolvedJobTitle = job_title;

    if (!resolvedJobId && resolvedJobTitle) {
      resolvedJobId = `job_${uuidv4().substring(0, 8)}`;

      const jobRecord = {
        id: resolvedJobId,
        title: resolvedJobTitle,
        location: 'Manual Entry',
        status: type === 'client_to_admin' ? 'Paid' : 'Scheduled',
        assignedTo: receiver_id || '1',
        deadline: new Date().toISOString().split('T')[0],
        clientId: payer_id || null,
        amount,
      };

      store.jobs.push(jobRecord as any);
    }

    if (!resolvedJobTitle && resolvedJobId) {
      resolvedJobTitle = store.jobs.find(j => j.id === resolvedJobId)?.title || '';
    }

    const newPayment = {
      id: uuidv4(),
      payer_id,
      payer_name: payer_name || store.clients.find(c => c.id === payer_id)?.name || 'Unknown Payer',
      receiver_id: receiver_id || 'admin', // Default to admin for client payments
      receiver_name: receiver_name || store.electricians.find(e => e.id === receiver_id)?.name || 'admin',
      job_id: resolvedJobId,
      job_title: resolvedJobTitle,
      amount,
      currency: 'INR',
      payment_type: type, // 'client_to_admin' | 'admin_to_electrician'
      gateway: 'Razorpay',
      gateway_order_id: order_id,
      gateway_payment_id: payment_id || `pay_${uuidv4().substring(0, 8)}`,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    store.payments.push(newPayment);
    
    // Update job status if applicable
    if (type === 'client_to_admin') {
      const jobIndex = store.jobs.findIndex(j => j.id === job_id);
      if (jobIndex !== -1) {
        store.jobs[jobIndex].status = 'Paid';
      }
    }
    
    sendSuccess(res, 'Payment verified and saved', newPayment);
  } else {
    sendError(res, 'Invalid payment signature', 400);
  }
});

export default router;
