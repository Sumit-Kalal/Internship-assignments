import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
};

function loadFirebaseConfig(): FirebaseConfig {
  const jsonFromEnv = process.env.FIREBASE_APPLET_CONFIG_JSON;
  if (jsonFromEnv) {
    return JSON.parse(jsonFromEnv) as FirebaseConfig;
  }

  const fromDiscreteEnv: Partial<FirebaseConfig> = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID,
  };

  if (
    fromDiscreteEnv.apiKey &&
    fromDiscreteEnv.authDomain &&
    fromDiscreteEnv.projectId &&
    fromDiscreteEnv.storageBucket &&
    fromDiscreteEnv.messagingSenderId &&
    fromDiscreteEnv.appId
  ) {
    return fromDiscreteEnv as FirebaseConfig;
  }

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw) as FirebaseConfig;
  }

  throw new Error(
    'Firebase config missing. Set FIREBASE_APPLET_CONFIG_JSON (preferred) or provide FIREBASE_* vars, or add firebase-applet-config.json in project root.'
  );
}

const firebaseConfig = loadFirebaseConfig();

/* 
  Initializing Firebase Client SDK in the backend.
  We use the Client SDK because it uses the API Key, which has correct permissions
  in this environment, avoiding the 7 PERMISSION_DENIED issues seen with the Admin SDK.
*/
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

export default app;
