import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  where 
} from 'firebase/firestore';
import { db } from './src/lib/firebase-admin.js';

import { authenticateToken, authorizeRole } from './src/middleware/auth.js';
import { sendSuccess, sendError } from './src/utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// That bottom section is already correct and should remain unchanged.

async function startServer() {
  // Create Express application
  const app = express();

  // Create HTTP server (required for Socket.IO)
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // Render provides PORT automatically
  const PORT = process.env.PORT || 3000;

  // Upload directory
  const uploadsDir = path.join(__dirname, 'uploads');

  // Ensure upload directory exists on fresh deployments
  fs.mkdirSync(uploadsDir, { recursive: true });

  // Global middleware
  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // Multer configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + file.originalname)
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowed = [
        'image/png',
        'image/jpeg',
        'application/pdf'
      ];

      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    }
  });

  // Socket.IO notification helper
  const notify = (msg: string) => {
    io.emit('notification', {
      id: Date.now(),
      message: msg,
      timestamp: new Date()
    });
  };

  // Base API route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/payments', paymentRoutes);

  // Upload Routes
  app.post(
    '/api/upload/report',
    authenticateToken,
    authorizeRole(['Admin']),
    upload.single('report'),
    (req: any, res: any) => {
      if (!req.file) return sendError(res, 'No file uploaded');

      const fileData = {
        id: req.file.filename,
        name: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        type: 'report',
        timestamp: new Date().toISOString()
      };

      notify(`New report uploaded: ${req.file.originalname}`);
      sendSuccess(res, 'Report uploaded', fileData);
    }
  );

  app.post(
    '/api/upload/image',
    authenticateToken,
    upload.single('image'),
    (req: any, res: any) => {
      if (!req.file) return sendError(res, 'No file uploaded');

      const fileData = {
        id: req.file.filename,
        name: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        type: 'image',
        timestamp: new Date().toISOString()
      };

      notify(`Media uploaded: ${req.file.originalname}`);
      sendSuccess(res, 'Image uploaded', fileData);
    }
  );

  // Ensure upload directory exists across fresh deploys.
  fs.mkdirSync(uploadsDir, { recursive: true });

  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // Multer config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
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

  // Upload Routes
  app.post('/api/upload/report', authenticateToken, authorizeRole(['Admin']), upload.single('report'), (req: any, res: any) => {
    if (!req.file) return sendError(res, 'No file uploaded');
    const fileData = {
      id: req.file.filename,
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      type: 'report',
      timestamp: new Date().toISOString()
    };
    notify(`New report uploaded: ${req.file.originalname}`);
    sendSuccess(res, 'Report uploaded', fileData);
  });

  app.post('/api/upload/image', authenticateToken, upload.single('image'), (req: any, res: any) => {
    if (!req.file) return sendError(res, 'No file uploaded');
    const fileData = {
      id: req.file.filename,
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      type: 'image',
      timestamp: new Date().toISOString()
    };
    notify(`Media uploaded: ${req.file.originalname}`);
    sendSuccess(res, 'Image uploaded', fileData);
  });

  // Clients CRUD
  app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, 'clients'));
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      sendSuccess(res, 'Clients fetched', clients);
    } catch (err) {
      sendError(res, 'Failed to fetch clients');
    }
  });

  app.post('/api/clients', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), req.body);
      const newItem = { id: docRef.id, ...(req.body as any) };
      notify(`New Client Added: ${newItem.name}`);
      sendSuccess(res, 'Client added', newItem, 201);
    } catch (err) {
      sendError(res, 'Failed to add client');
    }
  });

  app.put('/api/clients/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await updateDoc(doc(db, 'clients', req.params.id), req.body as any);
      sendSuccess(res, 'Client updated', { id: req.params.id, ...(req.body as any) });
    } catch (err) {
      sendError(res, 'Failed to update client');
    }
  });

  app.post('/api/reports', authenticateToken, authorizeRole(['Admin', 'Electrician']), async (req, res) => {
    try {
      const data = { ...(req.body as any), created_at: new Date().toISOString() };
      const docRef = await addDoc(collection(db, 'reports'), data);
      notify(`New Report Generated: ${req.body.title}`);
      sendSuccess(res, 'Report created', { id: docRef.id, ...data }, 201);
    } catch (err) {
      sendError(res, 'Failed to create report');
    }
  });

  // Electricians CRUD
  app.get('/api/electricians', authenticateToken, async (req, res) => {
    try {
      let q: any = collection(db, 'electricians');
      if (req.query.status) {
        q = query(q, where('status', '==', req.query.status));
      }
      if (req.query.availability && req.query.availability !== 'All') {
        q = query(q, where('availability', '==', req.query.availability));
      }
      const snapshot = await getDocs(q);
      const electricians = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      sendSuccess(res, 'Electricians fetched', electricians);
    } catch (err) {
      sendError(res, 'Failed to fetch electricians');
    }
  });

  app.post('/api/electricians', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      const docRef = await addDoc(collection(db, 'electricians'), req.body);
      notify(`New Electrician Onboarded: ${req.body.name}`);
      sendSuccess(res, 'Electrician added', { id: docRef.id, ...(req.body as any) }, 201);
    } catch (err) {
      sendError(res, 'Failed to add electrician');
    }
  });

  app.put('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await updateDoc(doc(db, 'electricians', req.params.id), req.body as any);
      sendSuccess(res, 'Electrician updated', { id: req.params.id, ...(req.body as any) });
    } catch (err) {
      sendError(res, 'Failed to update electrician');
    }
  });

  app.delete('/api/electricians/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'electricians', req.params.id));
      res.status(204).send();
    } catch (err) {
      sendError(res, 'Failed to delete electrician');
    }
  });

  // Jobs CRUD
  app.get('/api/jobs', authenticateToken, async (req: any, res) => {
    try {
      let q: any = collection(db, 'jobs');
      if (req.user.role === 'Client') {
        const clientSnap = await getDocs(query(collection(db, 'clients'), where('userId', '==', req.user.id)));
        if (clientSnap.empty) return sendSuccess(res, 'Jobs fetched', []);
        q = query(q, where('clientId', '==', clientSnap.docs[0].id));
      } else if (req.user.role === 'Electrician') {
        const elecSnap = await getDocs(query(collection(db, 'electricians'), where('userId', '==', req.user.id)));
        if (elecSnap.empty) return sendSuccess(res, 'Jobs fetched', []);
        q = query(q, where('assignedTo', '==', elecSnap.docs[0].id));
      }
      const snapshot = await getDocs(q);
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      sendSuccess(res, 'Jobs fetched', jobs);
    } catch (err) {
      sendError(res, 'Failed to fetch jobs');
    }
  });

  app.get('/api/jobs/search', authenticateToken, async (req, res) => {
    try {
      const keyword = (req.query.keyword as string || '').toLowerCase();
      const snapshot = await getDocs(collection(db, 'jobs'));
      const result = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(j => 
          j.title.toLowerCase().includes(keyword) || 
          j.location.toLowerCase().includes(keyword)
        );
      sendSuccess(res, 'Search complete', result);
    } catch (err) {
      sendError(res, 'Search failed');
    }
  });

  app.post('/api/jobs', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      const jobData = { 
        ...(req.body as any), 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      notify(`New Job Assigned: ${req.body.title}`);
      sendSuccess(res, 'Job created', { id: docRef.id, ...jobData }, 201);
    } catch (err: any) {
      console.error('Job creation error:', err);
      sendError(res, `Failed to create job: ${err.message || 'Unknown error'}`);
    }
  });

  app.put('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), async (req: any, res: any) => {
    try {
      const jobRef = doc(db, 'jobs', req.params.id);
      const oldSnap = await getDoc(jobRef);
      const oldData = oldSnap.exists() ? oldSnap.data() as any : null;
      
      const updateData = { 
        ...(req.body as any), 
        updated_at: new Date().toISOString() 
      };
      
      await updateDoc(jobRef, updateData);

      // Log status change if applicable
      if (oldData && req.body.status && req.body.status !== oldData.status) {
        const reportData = {
          title: `Job Status Change: ${oldData.title}`,
          type: 'Activity Log',
          date: new Date().toISOString().split('T')[0],
          author: req.user?.name || 'System',
          details: `Job status moved from ${oldData.status} to ${req.body.status}`,
          jobId: req.params.id,
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'reports'), reportData);
        notify(`Job "${oldData.title}" is now ${req.body.status}`);
      }
      
      sendSuccess(res, 'Job updated', { id: req.params.id, ...updateData });
    } catch (err) {
      console.error('Job update error:', err);
      sendError(res, 'Failed to update job');
    }
  });

  app.delete('/api/jobs/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'jobs', req.params.id));
      res.status(204).send();
    } catch (err) {
      sendError(res, 'Failed to delete job');
    }
  });

  // Tasks
  app.get('/api/tasks', authenticateToken, async (req: any, res: any) => {
    try {
      let q: any = collection(db, 'tasks');
      const userId = req.user.id;
      const userRole = req.user.role;

      if (userRole === 'Electrician') {
        const elecSnap = await getDocs(query(collection(db, 'electricians'), where('userId', '==', userId)));
        if (elecSnap.empty) return sendError(res, 'Profile not found', 404);
        q = query(q, where('electricianId', '==', elecSnap.docs[0].id));
      } else if (userRole === 'Client') {
        const clientSnap = await getDocs(query(collection(db, 'clients'), where('userId', '==', userId)));
        if (!clientSnap.empty) {
          const clientId = clientSnap.docs[0].id;
          const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('clientId', '==', clientId)));
          const jobIds = jobsSnap.docs.map(d => d.id);
          if (jobIds.length > 0) q = query(q, where('jobId', 'in', jobIds.slice(0, 10)));
          else return sendSuccess(res, 'Tasks fetched', []);
        }
      }

      if (req.query.status) {
        q = query(q, where('completed', '==', req.query.status === 'Completed'));
      }

      const snapshot = await getDocs(q);
      sendSuccess(res, 'Tasks fetched', snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    } catch (err) {
      sendError(res, 'Failed to fetch tasks');
    }
  });

  app.post('/api/tasks', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      const taskData = { ...(req.body as any), completed: false, date: new Date().toISOString().split('T')[0] };
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      notify(`New task created for job #${req.body.jobId}`);
      sendSuccess(res, 'Task created', { id: docRef.id, ...taskData }, 201);
    } catch (err) {
      sendError(res, 'Failed to create task');
    }
  });

  app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
      const taskRef = doc(db, 'tasks', req.params.id);
      const snapshot = await getDocs(query(collection(db, 'tasks'), where('__name__', '==', req.params.id)));
      
      if (snapshot.empty) return sendError(res, 'Task not found', 404);
      
      const oldTask = snapshot.docs[0].data() as any;
      await updateDoc(taskRef, req.body as any);
      
      if (!oldTask?.completed && req.body.completed) {
        notify(`Task completed: ${req.body.description}`);
        
        // Log activity
        const reportData = {
          title: `Task Completed: ${oldTask.description}`,
          type: 'Activity Log',
          date: new Date().toISOString().split('T')[0],
          author: (req as any).user?.name || 'Electrician',
          details: `Task was marked as completed.`,
          jobId: oldTask.jobId,
          created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'reports'), reportData);
      }
      sendSuccess(res, 'Task updated', { id: req.params.id, ...(req.body as any) });
    } catch (err) {
      sendError(res, 'Failed to update task');
    }
  });

  // Materials CRUD
  app.get('/api/materials', authenticateToken, async (req, res) => {
    try {
      const snap = await getDocs(collection(db, 'materials'));
      sendSuccess(res, 'Materials fetched', snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { sendError(res, 'Failed'); }
  });

  app.post('/api/materials', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      const ref = await addDoc(collection(db, 'materials'), req.body);
      notify(`New material added to inventory: ${req.body.name}`);
      sendSuccess(res, 'Added', { id: ref.id, ...(req.body as any) }, 201);
    } catch (err) { sendError(res, 'Failed'); }
  });

  app.put('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await updateDoc(doc(db, 'materials', req.params.id), req.body as any);
      sendSuccess(res, 'Updated', { id: req.params.id, ...(req.body as any) });
    } catch (err) { sendError(res, 'Failed'); }
  });

  app.delete('/api/materials/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'materials', req.params.id));
      res.status(204).send();
    } catch (err) { sendError(res, 'Failed'); }
  });

  // Reports CRUD
  app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
      const snap = await getDocs(collection(db, 'reports'));
      sendSuccess(res, 'Reports fetched', snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { sendError(res, 'Failed'); }
  });

  app.delete('/api/reports/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'reports', req.params.id));
      res.status(204).send();
    } catch (err) { sendError(res, 'Failed'); }
  });

  app.delete('/api/tasks/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'tasks', req.params.id));
      res.status(204).send();
    } catch (err) {
      sendError(res, 'Failed to delete task');
    }
  });

  app.delete('/api/payments/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'payments', req.params.id));
      res.status(204).send();
    } catch (err) {
      sendError(res, 'Failed to delete payment');
    }
  });

  app.delete('/api/clients/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    try {
      await deleteDoc(doc(db, 'clients', req.params.id));
      res.status(204).send();
    } catch (err) {
      sendError(res, 'Failed to delete client');
    }
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
