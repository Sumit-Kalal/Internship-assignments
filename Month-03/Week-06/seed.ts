import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import bcrypt from 'bcryptjs';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function seed() {
  console.log('Seeding initial data via Client SDK...');

  try {
    const passwordHash = bcrypt.hashSync('password123', 10);

    // 1. Create Admin User
    const adminId = 'admin_user_001';
    await setDoc(doc(db, 'users', adminId), {
      name: 'Super Admin',
      email: 'admin@voltmanager.com',
      password: passwordHash,
      role: 'Admin',
      created_at: new Date().toISOString()
    });
    console.log('Admin user created');

    // 2. Add some electricians as users first
    const electriciansData = [
      { id: 'elec_1', name: 'Rajesh Kumar', email: 'rajesh@voltmanager.com', level: 'Master', status: 'Active', availability: 'Available' },
      { id: 'elec_2', name: 'Amit Singh', email: 'amit@voltmanager.com', level: 'Journeyman', status: 'Active', availability: 'Busy' }
    ];

    for (const e of electriciansData) {
      await setDoc(doc(db, 'users', e.id), {
        name: e.name,
        email: e.email,
        password: passwordHash,
        role: 'Electrician',
        created_at: new Date().toISOString()
      });
      await addDoc(collection(db, 'electricians'), {
        userId: e.id,
        name: e.name,
        level: e.level,
        status: e.status,
        availability: e.availability
      });
    }
    console.log('Electricians seeded');

    // 3. Add some clients as users first
    const clientsData = [
      { id: 'client_1', name: 'Tata Steel', email: 'tata@example.com', company: 'Tata Group', phone: '022-1234567', address: 'Mumbai' }
    ];

    for (const c of clientsData) {
      await setDoc(doc(db, 'users', c.id), {
        name: c.name,
        email: c.email,
        password: passwordHash,
        role: 'Client',
        created_at: new Date().toISOString()
      });
      await addDoc(collection(db, 'clients'), {
        userId: c.id,
        name: c.name,
        company: c.company,
        phone: c.phone,
        address: c.address
      });
    }
    console.log('Clients seeded');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
