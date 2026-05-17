import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = Number(process.env.PORT) || 3000;

/* -------------------- CORE MIDDLEWARE -------------------- */
app.use(express.json());

/* -------------------- STATIC / UPLOADS -------------------- */
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

/* -------------------- MULTER -------------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

/* -------------------- SOCKET -------------------- */
const notify = (msg: string) => {
  io.emit('notification', {
    id: Date.now(),
    message: msg,
    timestamp: new Date()
  });
};

/* -------------------- BASE ROUTES -------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (_req, res) => {
  res.send('Server is running');
});

/* -------------------- UPLOAD ROUTES -------------------- */
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

/* -------------------- CLIENTS -------------------- */
app.get('/api/clients', authenticateToken, async (_req, res) => {
  try {
    const snap = await getDocs(collection(db, 'clients'));
    sendSuccess(res, 'Clients fetched', snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {
    sendError(res, 'Failed to fetch clients');
  }
});

app.post('/api/clients', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const ref = await addDoc(collection(db, 'clients'), req.body);
    notify(`New Client Added`);
    sendSuccess(res, 'Client added', { id: ref.id, ...req.body }, 201);
  } catch {
    sendError(res, 'Failed to add client');
  }
});

/* -------------------- GENERIC CRUD ROUTES -------------------- */
const genericCollections = ['jobs', 'materials', 'tasks', 'electricians', 'reports', 'clients'];

genericCollections.forEach((collectionName) => {
  // GET all documents in collection
  app.get(`/api/${collectionName}`, authenticateToken, async (_req, res) => {
    try {
      const snap = await getDocs(collection(db, collectionName));
      sendSuccess(res, `${collectionName} fetched`, snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      sendError(res, `Failed to fetch ${collectionName}`);
    }
  });

  // GET single document by ID
  app.get(`/api/${collectionName}/:id`, authenticateToken, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, collectionName, req.params.id));
      if (docSnap.exists()) {
        sendSuccess(res, `${collectionName} fetched`, { id: docSnap.id, ...docSnap.data() });
      } else {
        sendError(res, `${collectionName} not found`, 404);
      }
    } catch {
      sendError(res, `Failed to fetch ${collectionName}`);
    }
  });

  // POST create new document
  app.post(`/api/${collectionName}`, authenticateToken, async (req: any, res) => {
    try {
      const ref = await addDoc(collection(db, collectionName), req.body);
      notify(`New ${collectionName.slice(0, -1)} added`);
      sendSuccess(res, `${collectionName.slice(0, -1)} created`, { id: ref.id, ...req.body }, 201);
    } catch {
      sendError(res, `Failed to create ${collectionName.slice(0, -1)}`);
    }
  });

  // PUT update document
  app.put(`/api/${collectionName}/:id`, authenticateToken, async (req: any, res) => {
    try {
      await updateDoc(doc(db, collectionName, req.params.id), req.body);
      notify(`${collectionName.slice(0, -1)} updated`);
      sendSuccess(res, `${collectionName.slice(0, -1)} updated`, { id: req.params.id, ...req.body });
    } catch {
      sendError(res, `Failed to update ${collectionName.slice(0, -1)}`);
    }
  });

  // DELETE document
  app.delete(`/api/${collectionName}/:id`, authenticateToken, async (req: any, res) => {
    try {
      await deleteDoc(doc(db, collectionName, req.params.id));
      notify(`${collectionName.slice(0, -1)} deleted`);
      sendSuccess(res, `${collectionName.slice(0, -1)} deleted`);
    } catch {
      sendError(res, `Failed to delete ${collectionName.slice(0, -1)}`);
    }
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  sendError(res, err.message || 'Internal Server Error', 500);
});

/* -------------------- VITE / PRODUCTION -------------------- */
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* -------------------- START -------------------- */
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});