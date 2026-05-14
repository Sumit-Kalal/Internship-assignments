import express from 'express';
import { store } from '../models/store.js';
import { sendSuccess } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, (req, res) => {
  const totalTasks = store.tasks.length;
  const completed = store.tasks.filter(t => t.completed).length;
  const pending = store.tasks.filter(t => !t.completed).length; // In this mock, pending is just !completed
  
  // Real stats for charts
  const statusDistribution = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending },
    { name: 'In Progress', value: store.jobs.filter(j => j.status === 'In Progress').length }
  ];

  const tasksByDay = store.tasks.reduce((acc: any, t) => {
    const date = t.date || 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const performance = store.electricians.map(e => ({
    name: e.name,
    completed: store.tasks.filter(t => t.electricianId === e.id && t.completed).length
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
});

export default router;
