import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

async function test() {
  console.log('Testing Firebase CLIENT SDK connectivity from Node...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
    const snap = await getDocs(query(collection(db, 'test'), limit(1)));
    console.log('Success accessing via Client SDK!');
  } catch (e: any) {
    console.log('Failed accessing via Client SDK:', e.message);
  }
}

test();
