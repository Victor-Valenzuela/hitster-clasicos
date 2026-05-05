import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'fs';

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

async function descargar() {
  const snapshot = await getDocs(collection(db, 'canciones'));
  const canciones = snapshot.docs.map((d, i) => ({
    id: String(i + 1),
    titulo: d.data().titulo,
    artista: d.data().artista,
    year: d.data().year,
    genero: d.data().genero
  }));

  canciones.sort((a, b) => a.artista.localeCompare(b.artista) || a.year - b.year);

  writeFileSync('./src/data/clasicos.json', JSON.stringify(canciones, null, 2), 'utf-8');
  console.log(`✅ ${canciones.length} canciones descargadas a clasicos.json`);
  process.exit(0);
}

descargar().catch(e => { console.error(e); process.exit(1); });
