import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyAkPSMvLNWn0jTu-gzFJmwirIR8V7G0CF8",
  authDomain: "hitster-9fc68.firebaseapp.com",
  projectId: "hitster-9fc68",
  storageBucket: "hitster-9fc68.firebasestorage.app",
  messagingSenderId: "772447190120",
  appId: "1:772447190120:web:8d30c4c04ae0db39cf0fdd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const canciones = JSON.parse(readFileSync('./src/data/clasicos.json', 'utf-8'));

async function migrar() {
  // Borrar existentes
  console.log('Borrando canciones existentes...');
  const snapshot = await getDocs(collection(db, 'canciones'));
  if (snapshot.size > 0) {
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`Borradas ${snapshot.size} canciones`);
  }

  // Subir nuevas
  console.log(`Subiendo ${canciones.length} canciones...`);
  const batch = writeBatch(db);
  canciones.forEach(c => {
    const ref = doc(collection(db, 'canciones'));
    batch.set(ref, {
      titulo: c.titulo,
      artista: c.artista,
      year: c.year,
      genero: c.genero
    });
  });
  await batch.commit();

  console.log('✅ Migración completada');
  process.exit(0);
}

migrar().catch(e => { console.error(e); process.exit(1); });
