import express from 'express';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase-admin.js';

import { sendSuccess, sendError } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    
    const totalTasks = tasks.length;
    const completed = tasks.filter((t: any) => t.completed).length;
    const pending = totalTasks - completed;
    
    const jobsSnapshot = await getDocs(collection(db, 'jobs'));
    const jobs = jobsSnapshot.docs.map(doc => doc.data() as any);

    const statusDistribution = [
      { name: 'Completed', value: completed },
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: jobs.filter((j: any) => j.status === 'In Progress').length }
    ];

    const tasksByDay = tasks.reduce((acc: any, t: any) => {
      const date = t.date || 'Unknown';
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const electriciansSnapshot = await getDocs(collection(db, 'electricians'));
    const electricians = electriciansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const performance = electricians.map(e => ({
      name: e.name,
      completed: tasks.filter((t: any) => t.electricianId === e.id && t.completed).length
    }));

    sendSuccess(res, 'Stats fetched', {
      totalTasks,
      completed,
      pending,
      charts: {
        statusDistribution,
        tasksByDay: Object.entries(tasksByDay).map(([date, count]) => ({ date, count })),
        performance
      }
    });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to fetch stats');
  }
});

export default router;
