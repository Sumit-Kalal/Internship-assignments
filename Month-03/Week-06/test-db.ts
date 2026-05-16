import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

async function test() {
  console.log('Testing Firestore connectivity...');
  console.log('Project:', firebaseConfig.projectId);
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);

  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });

    const dbDefault = getFirestore();
    const dbNamed = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

    console.log('\n--- Testing (default) database ---');
    try {
      const snap = await dbDefault.collection('test').limit(1).get();
      console.log('Success accessing (default)');
    } catch (e: any) {
      console.log('Failed accessing (default):', e.message);
    }

    console.log('\n--- Testing named database ---');
    try {
      const snap = await dbNamed.collection('test').limit(1).get();
      console.log('Success accessing named');
    } catch (e: any) {
      console.log('Failed accessing named:', e.message);
    }

  } catch (err: any) {
    console.error('Fatal initialization error:', err.message);
  }
}

test();
