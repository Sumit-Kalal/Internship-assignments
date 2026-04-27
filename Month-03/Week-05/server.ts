import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import { store, persistStore } from './src/models/store.js';
import { authenticateToken, authorizeRole } from './src/middleware/auth.js';
import { sendSuccess, sendError } from './src/utils/response.js';
import { SERVER_CONFIG, UPLOAD_CONFIG } from './src/config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration constants
const SERVER_PORT = SERVER_CONFIG.PORT;
const MAX_FILE_SIZE = UPLOAD_CONFIG.MAX_FILE_SIZE;
const ALLOWED_FILE_TYPES = UPLOAD_CONFIG.ALLOWED_TYPES;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time notifications
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`\n➡️ ${req.method.toUpperCase()} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('   Body:', JSON.stringify(req.body).substring(0, 100));
    }
    next();
  });

  // Configure file upload handler
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      const isAllowed = ALLOWED_FILE_TYPES.includes(file.mimetype);
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('Only PNG, JPEG, and PDF files are allowed'));
      }
    }
  });

  /**
   * Broadcast real-time notifications to all connected clients
   * Used for job updates, task completions, and system alerts
   */
  const notifyClients = (message: string) => {
    io.emit('notification', {
      id: Date.now(),
      message,
      timestamp: new Date()
    });
  };

  // Register main API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // ============ ELECTRICIANS MANAGEMENT ============
  // List all electricians with optional status/availability filtering
  app.get('/api/electricians', authenticateToken, (req, res) => {
    let result = [...store.electricians];

    if (req.query.status) {
      result = result.filter(e => e.status === req.query.status);
    }

    if (req.query.availability && req.query.availability !== 'All') {
      result = result.filter(e => e.availability === req.query.availability);
    }

    sendSuccess(res, 'Electricians fetched', result);
  });

  // Add new electrician (Admin only)
  app.post('/api/electricians', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    try {
      const newElectrician = { ...req.body, id: Date.now().toString() };
      console.log('   ✅ Creating electrician:', newElectrician.name);
      store.electricians.push(newElectrician);
      persistStore();
      console.log('   💾 Saved to database');
      sendSuccess(res, 'Electrician added', newElectrician, 201);
    } catch (err) {
      console.error('   ❌ Error:', err);
      sendError(res, 'Failed to create electrician', 500);
    }
  });

  // Update electrician details (Admin only)
  app.put('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.electricians = store.electricians.map(e =>
      e.id === req.params.id ? { ...req.body, id: e.id } : e
    );
    persistStore();
    sendSuccess(res, 'Electrician updated', store.electricians.find(e => e.id === req.params.id));
  });

  // Remove electrician from system (Admin only)
  app.delete('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.electricians = store.electricians.filter(e => e.id !== req.params.id);
    persistStore();
    res.status(204).send();
  });

  // ============ JOBS MANAGEMENT ============
  // Retrieve all active jobs
  app.get('/api/jobs', authenticateToken, (req, res) => {
    sendSuccess(res, 'Jobs fetched', store.jobs);
  });

  // Search jobs by title, location, or assigned electrician
  app.get('/api/jobs/search', authenticateToken, (req, res) => {
    const keyword = (req.query.keyword as string || '').toLowerCase();
    const result = store.jobs.filter(j =>
      j.title.toLowerCase().includes(keyword) ||
      j.location.toLowerCase().includes(keyword) ||
      store.electricians.find(e => e.id === j.assignedTo)?.name.toLowerCase().includes(keyword)
    );
    sendSuccess(res, 'Search complete', result);
  });

  // Create new job (Admin only)
  app.post('/api/jobs', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    try {
      const newJob = { ...req.body, id: Date.now().toString() };
      console.log('   ✅ Creating job:', newJob.title);
      store.jobs.push(newJob);
      persistStore();
      console.log('   💾 Saved to database');
      notifyClients(`New Job Assigned: ${newJob.title}`);
      sendSuccess(res, 'Job created', newJob, 201);
    } catch (err) {
      console.error('   ❌ Error:', err);
      sendError(res, 'Failed to create job', 500);
    }
  });

  // Update job details (Admin only)
  app.put('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.jobs = store.jobs.map(j =>
      j.id === req.params.id ? { ...req.body, id: j.id } : j
    );
    persistStore();
    sendSuccess(res, 'Job updated', store.jobs.find(j => j.id === req.params.id));
  });

  // Delete job from system (Admin only)
  app.delete('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.jobs = store.jobs.filter(j => j.id !== req.params.id);
    persistStore();
    res.status(204).send();
  });

  // ============ TASKS MANAGEMENT ============
  // Get tasks (Electricians see only their own, Admins see all)
  app.get('/api/tasks', authenticateToken, (req: any, res: any) => {
    let result = [...store.tasks];
    const userRole = req.user.role;
    const userId = req.user.id;

    // Filter by role: electricians only see assigned tasks
    if (userRole === 'Electrician') {
      const electrician = store.electricians.find(e => e.userId === userId);
      if (electrician) {
        result = result.filter(t => t.electricianId === electrician.id);
      } else {
        return sendError(res, 'Electrician profile not found', 404);
      }
    }

    // Optional status filtering
    if (req.query.status) {
      const status = req.query.status as string;
      result = result.filter(t =>
        status === 'Completed' ? t.completed : !t.completed
      );
    }

    sendSuccess(res, 'Tasks fetched', result);
  });

  // Create new task (Admin only)
  app.post('/api/tasks', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    try {
      const newTask = {
        ...req.body,
        id: Date.now().toString(),
        completed: req.body.completed || false,
        date: req.body.date || new Date().toISOString().split('T')[0]
      };
      console.log('   ✅ Creating task:', newTask.description);
      store.tasks.push(newTask);
      persistStore();
      console.log('   💾 Saved to database');
      sendSuccess(res, 'Task created', newTask, 201);
    } catch (err) {
      console.error('   ❌ Error:', err);
      sendError(res, 'Failed to create task', 500);
    }
  });

  // Update task status or details (Electricians can mark as complete, Admins can edit)
  app.put('/api/tasks/:id', authenticateToken, (req: any, res: any) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const oldTask = store.tasks.find(t => t.id === req.params.id);

    if (!oldTask) return sendError(res, 'Task not found', 404);

    // Authorization: Only admins or assigned electrician can update task
    if (userRole === 'Electrician') {
      const electrician = store.electricians.find(e => e.userId === userId);
      if (!electrician || electrician.id !== oldTask.electricianId) {
        return sendError(res, 'You can only update your assigned tasks', 403);
      }
    } else if (userRole !== 'Admin') {
      return sendError(res, 'Unauthorized to update tasks', 403);
    }

    store.tasks = store.tasks.map(t =>
      t.id === req.params.id ? { ...req.body, id: t.id } : t
    );
    persistStore();

    const updatedTask = store.tasks.find(t => t.id === req.params.id)!;

    // Notify when task transitions from pending to completed
    if (!oldTask.completed && updatedTask.completed) {
      notifyClients(`Task completed successfully: ${updatedTask.description}`);
    }

    sendSuccess(res, 'Task updated', updatedTask);
  });

  // ============ FILE UPLOADS ============
  // Upload work evidence image (All authenticated users)
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
    persistStore();
    sendSuccess(res, 'Image uploaded successfully', uploadInfo);
  });

  // Upload work report (Admin only)
  app.post('/api/upload/report', authenticateToken, authorizeRole(['Admin']), upload.single('report'), (req: any, res: any) => {
    if (!req.file) return sendError(res, 'No file uploaded', 400);

    const uploadInfo = {
      id: Date.now().toString(),
      type: 'report',
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      timestamp: new Date()
    };
    store.uploads.push(uploadInfo);
    persistStore();
    sendSuccess(res, 'Report uploaded successfully', uploadInfo);
  });

  // ============ REPORTING & ANALYTICS ============
  // Get daily work report filtered by date
  app.get('/api/reports/daily', authenticateToken, (req, res) => {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const dailyTasks = store.tasks.filter(t => t.date === date);

    const reportData = dailyTasks.map(t => {
      const electrician = store.electricians.find(e => e.id === t.electricianId);
      return {
        date: t.date,
        electricianName: electrician ? electrician.name : 'Unknown',
        taskName: t.description,
        status: t.completed ? 'Completed' : 'Pending',
        hoursWorked: t.hoursWorked
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    sendSuccess(res, 'Daily report fetched', reportData);
  });

  // Get task completion metrics
  app.get('/api/reports/completion', authenticateToken, (req, res) => {
    const total = store.tasks.length;
    const completed = store.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    sendSuccess(res, 'Completion report fetched', {
      total,
      completed,
      pending,
      rate: completionRate.toFixed(1)
    });
  });

  // Get per-electrician performance metrics
  app.get('/api/reports/electrician', authenticateToken, (req, res) => {
    const reportData = store.electricians.map(e => {
      const electricianTasks = store.tasks.filter(t => t.electricianId === e.id);
      return {
        name: e.name,
        assigned: electricianTasks.length,
        completed: electricianTasks.filter(t => t.completed).length,
        pending: electricianTasks.filter(t => !t.completed).length,
        lastActivity: 'Recent'
      };
    });

    sendSuccess(res, 'Electrician report fetched', reportData);
  });

  app.delete('/api/tasks/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.tasks = store.tasks.filter(t => t.id !== req.params.id);
    res.status(204).send();
  });

  // ============ MATERIALS INVENTORY ============
  app.get('/api/materials', authenticateToken, (req, res) =>
    sendSuccess(res, 'Materials fetched', store.materials)
  );

  app.post('/api/materials', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    try {
      const newMaterial = { ...req.body, id: Date.now().toString() };
      console.log('   ✅ Creating material:', newMaterial.name);
      store.materials.push(newMaterial);
      persistStore();
      console.log('   💾 Saved to database');
      sendSuccess(res, 'Material added', newMaterial, 201);
    } catch (err) {
      console.error('   ❌ Error:', err);
      sendError(res, 'Failed to create material', 500);
    }
  });

  app.put('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.materials = store.materials.map(m =>
      m.id === req.params.id ? { ...req.body, id: m.id } : m
    );
    persistStore();
    sendSuccess(res, 'Material updated', store.materials.find(m => m.id === req.params.id));
  });

  app.delete('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.materials = store.materials.filter(m => m.id !== req.params.id);
    persistStore();
    res.status(204).send();
  });

  // ============ SYSTEM REPORTS ============
  app.get('/api/reports', authenticateToken, (req, res) =>
    sendSuccess(res, 'Reports fetched', store.reports)
  );

  app.delete('/api/reports/:id', authenticateToken, authorizeRole(['Admin']), (req, res) => {
    store.reports = store.reports.filter(r => r.id !== req.params.id);
    persistStore();
    res.status(204).send();
  });

  // ============ ERROR HANDLING ============
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server error:', err);
    sendError(res, err.message || 'Internal Server Error', 500);
  });

  // ============ FRONTEND SERVING ============
  // In development: use Vite dev server with HMR
  // In production: serve pre-built static assets
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

  // Start listening on all network interfaces
  httpServer.listen(SERVER_PORT, SERVER_CONFIG.HOST, () => {
    console.log(`🔌 VoltManager server running on http://localhost:${SERVER_PORT}`);
    console.log(`📡 WebSocket ready for real-time notifications`);
    console.log(`🌍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
