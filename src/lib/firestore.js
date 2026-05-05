import {
    getDb
} from './firebase.js';

const CANCIONES_COL = 'canciones';
const SUGERENCIAS_COL = 'sugerencias';

export async function obtenerCanciones() {
    const db = await getDb();
    const {
        collection,
        getDocs
    } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, CANCIONES_COL));
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

export async function obtenerSugerencias() {
    const db = await getDb();
    const {
        collection,
        getDocs
    } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, SUGERENCIAS_COL));
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

export async function enviarSugerencia(sugerencia) {
    const db = await getDb();
    const {
        collection,
        addDoc
    } = await import('firebase/firestore');
    await addDoc(collection(db, SUGERENCIAS_COL), sugerencia);
}