import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import { store } from './src/models/store.js';
import { authenticateToken, authorizeRole } from './src/middleware/auth.js';
import { sendSuccess, sendError } from './src/utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Multer config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Invalid file type'));
    }
  });

  // Helper to notify
  const notify = (msg: string) => {
    io.emit('notification', { id: Date.now(), message: msg, timestamp: new Date() });
  };

  // Middlewares for API
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/payments', paymentRoutes);

  // Clients CRUD
  app.get('/api/clients', authenticateToken, (req, res) => {
    sendSuccess(res, 'Clients fetched', store.clients);
  });

  app.post('/api/clients', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    const newItem = { ...req.body, id: Date.now().toString() };
    store.clients.push(newItem);
    sendSuccess(res, 'Client added', newItem, 201);
  });

  // Electricians CRUD
  app.get('/api/electricians', authenticateToken, (req, res) => {
    let result = [...store.electricians];
    if (req.query.status) result = result.filter(e => e.status === req.query.status);
    if (req.query.availability && req.query.availability !== 'All') {
      result = result.filter(e => e.availability === req.query.availability);
    }
    sendSuccess(res, 'Electricians fetched', result);
  });

  app.post('/api/electricians', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    const newItem = { ...req.body, id: Date.now().toString() };
    store.electricians.push(newItem);
    sendSuccess(res, 'Electrician added', newItem, 201);
  });

  app.put('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.electricians = store.electricians.map(e => e.id === req.params.id ? { ...req.body, id: e.id } : e);
    sendSuccess(res, 'Electrician updated', store.electricians.find(e => e.id === req.params.id));
  });

  app.delete('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.electricians = store.electricians.filter(e => e.id !== req.params.id);
    res.status(204).send();
  });

  // Jobs CRUD
  app.get('/api/jobs', authenticateToken, (req: any, res) => {
    let result = [...store.jobs];
    if (req.user.role === 'Client') {
      const client = store.clients.find(c => c.userId === req.user.id);
      result = result.filter(j => j.clientId === client?.id);
    } else if (req.user.role === 'Electrician') {
      const elec = store.electricians.find(e => e.userId === req.user.id);
      result = result.filter(j => j.assignedTo === elec?.id);
    }
    sendSuccess(res, 'Jobs fetched', result);
  });

  app.get('/api/jobs/search', authenticateToken, (req, res) => {
    const keyword = (req.query.keyword as string || '').toLowerCase();
    const result = store.jobs.filter(j => 
      j.title.toLowerCase().includes(keyword) || 
      j.location.toLowerCase().includes(keyword) ||
      store.electricians.find(e => e.id === j.assignedTo)?.name.toLowerCase().includes(keyword)
    );
    sendSuccess(res, 'Search complete', result);
  });

  app.post('/api/jobs', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    const newItem = { ...req.body, id: Date.now().toString() };
    store.jobs.push(newItem);
    notify(`New Job Assigned: ${newItem.title}`);
    sendSuccess(res, 'Job created', newItem, 201);
  });

  app.put('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.jobs = store.jobs.map(j => j.id === req.params.id ? { ...req.body, id: j.id } : j);
    sendSuccess(res, 'Job updated', store.jobs.find(j => j.id === req.params.id));
  });

  app.delete('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.jobs = store.jobs.filter(j => j.id !== req.params.id);
    res.status(204).send();
  });

  // Tasks
  app.get('/api/tasks', authenticateToken, (req: any, res: any) => {
    let result = [...store.tasks];
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    if (userRole === 'Electrician') {
      const elec = store.electricians.find(e => e.userId === userId);
      if (elec) {
        result = result.filter(t => t.electricianId === elec.id);
      } else {
        return sendError(res, 'Electrician profile not found', 404);
      }
    } else if (userRole === 'Client') {
      const client = store.clients.find(c => c.userId === userId);
      if (client) {
        const clientJobs = store.jobs.filter(j => j.clientId === client.id).map(j => j.id);
        result = result.filter(t => clientJobs.includes(t.jobId));
      }
    }

    if (req.query.status) {
      const status = req.query.status as string;
      if (status === 'Completed') result = result.filter(t => t.completed);
      else if (status === 'Pending') result = result.filter(t => !t.completed);
    }
    sendSuccess(res, 'Tasks fetched', result);
  });

  app.post('/api/tasks', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    const newItem = { ...req.body, id: Date.now().toString(), completed: false, date: new Date().toISOString().split('T')[0] };
    store.tasks.push(newItem);
    sendSuccess(res, 'Task created', newItem, 201);
  });

  app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const oldTask = store.tasks.find(t => t.id === req.params.id);
    if (!oldTask) return sendError(res, 'Task not found', 404);

    store.tasks = store.tasks.map(t => t.id === req.params.id ? { ...req.body, id: t.id } : t);
    const newTask = store.tasks.find(t => t.id === req.params.id)!;
    
    if (!oldTask.completed && newTask.completed) {
      notify(`Task completed successfully: ${newTask.description}`);
    }
    
    sendSuccess(res, 'Task updated', newTask);
  });

  // File Upload
  app.post('/api/upload/image', authenticateToken, upload.single('image'), (req: any, res: any) => {
    if (!req.file) return sendError(res, 'No file uploaded', 400);
    const uploadInfo = {
      id: Date.now().toString(),
      type: 'image',
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      timestamp: new Date()
    };
    store.uploads.push(uploadInfo);
    sendSuccess(res, 'Image uploaded successfully', uploadInfo);
  });

  app.post('/api/upload/report', authenticateToken, authorizeRole(['Admin']), upload.single('report'), (req: any, res: any) => {
    if (!req.file) return sendError(res, 'No file uploaded', 400);
    const category = ['meta', 'daily', 'completion', 'electrician'].includes(req.body.category) ? req.body.category : 'meta';
    const uploadInfo = {
      id: Date.now().toString(),
      type: 'report',
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      timestamp: new Date()
    };
    store.uploads.push(uploadInfo);

    const reportRecord = {
      id: uploadInfo.id,
      title: req.file.originalname.replace(/\.[^.]+$/, ''),
      author: req.user.name || 'System Admin',
      date: new Date().toISOString().split('T')[0],
      filePath: uploadInfo.path,
      category
    };

    store.reports.unshift(reportRecord);
    notify(`New report added: ${reportRecord.title}`);

    sendSuccess(res, 'Report uploaded successfully', { ...uploadInfo, report: reportRecord });
  });

  // Reports
  app.get('/api/reports/daily', authenticateToken, (req, res) => {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const dailyTasks = store.tasks.filter(t => t.date === date);
    const reportData = dailyTasks.map(t => {
      const elec = store.electricians.find(e => e.id === t.electricianId);
      return {
        date: t.date,
        electricianName: elec ? elec.name : 'Unknown',
        taskName: t.description,
        status: t.completed ? 'Completed' : 'Pending',
        hoursWorked: t.hoursWorked
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
    sendSuccess(res, 'Daily report fetched', reportData);
  });

  app.get('/api/reports/completion', authenticateToken, (req, res) => {
    const total = store.tasks.length;
    const completed = store.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    sendSuccess(res, 'Completion report fetched', { total, completed, pending, rate: rate.toFixed(1) });
  });

  app.get('/api/reports/electrician', authenticateToken, (req, res) => {
    const reportData = store.electricians.map(e => {
      const eTasks = store.tasks.filter(t => t.electricianId === e.id);
      return {
        name: e.name,
        assigned: eTasks.length,
        completed: eTasks.filter(t => t.completed).length,
        pending: eTasks.filter(t => !t.completed).length,
        lastActivity: 'Recent'
      };
    });
    sendSuccess(res, 'Electrician report fetched', reportData);
  });

  app.delete('/api/tasks/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.tasks = store.tasks.filter(t => t.id !== req.params.id);
    res.status(204).send();
  });

  // Materials CRUD
  app.get('/api/materials', authenticateToken, (req, res) => sendSuccess(res, 'Materials fetched', store.materials));
  app.post('/api/materials', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    const newItem = { ...req.body, id: Date.now().toString() };
    store.materials.push(newItem);
    sendSuccess(res, 'Material added', newItem, 201);
  });
  app.put('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.materials = store.materials.map(m => m.id === req.params.id ? { ...req.body, id: m.id } : m);
    sendSuccess(res, 'Material updated', store.materials.find(m => m.id === req.params.id));
  });
  app.delete('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.materials = store.materials.filter(m => m.id !== req.params.id);
    res.status(204).send();
  });

  // Reports CRUD (Basic)
  app.get('/api/reports', authenticateToken, (req, res) => sendSuccess(res, 'Reports fetched', store.reports));
  app.delete('/api/reports/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.reports = store.reports.filter(r => r.id !== req.params.id);
    res.status(204).send();
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    sendError(res, err.message || 'Internal Server Error', 500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
