import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

/* 
  Initializing Firebase Client SDK in the backend.
  We use the Client SDK because it uses the API Key, which has correct permissions
  in this environment, avoiding the 7 PERMISSION_DENIED issues seen with the Admin SDK.
*/
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

export default app;
