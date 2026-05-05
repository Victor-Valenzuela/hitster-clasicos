let app;
let db;

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

export async function getDb() {
  if (db) return db;
  const {
    initializeApp
  } = await import('firebase/app');
  const {
    getFirestore
  } = await import('firebase/firestore');
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}