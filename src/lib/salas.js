import { getDb } from './firebase.js';

const SALAS_COL = 'salas';
const SESSION_KEY = 'hitster_session';
const SALA_TTL = 24 * 60 * 60 * 1000;

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generarSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function guardarSession(codigo, nombre, sessionId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ codigo, nombre, sessionId }));
}

export function obtenerSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function limpiarSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function limpiarSalasViejas() {
  try {
    const db = await getDb();
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(db, SALAS_COL));
    const ahora = Date.now();
    const borrar = [];
    snapshot.docs.forEach(d => {
      const data = d.data();
      if (data.creadoEn && (ahora - data.creadoEn) > SALA_TTL) {
        borrar.push(d.ref);
      }
    });
    for (const ref of borrar) {
      await deleteDoc(ref);
    }
    if (borrar.length > 0) console.log(`Limpiadas ${borrar.length} salas viejas`);
  } catch (e) {
    console.warn('Error limpiando salas:', e);
  }
}

export async function crearSala(hostNombre, generos, mazo) {
  const db = await getDb();
  const { doc, setDoc, getDoc } = await import('firebase/firestore');

  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigo();
    const ref = doc(db, SALAS_COL, codigo);
    const snap = await getDoc(ref);
    if (!snap.exists()) break;
    intentos++;
  } while (intentos < 10);

  const sessionId = generarSessionId();

  const sala = {
    codigo,
    host: hostNombre,
    estado: 'esperando',
    jugadores: [{ nombre: hostNombre, linea: [], puntos: 0, saltos: 3, sessionId }],
    generos,
    modo: 'clasico',
    mazo,
    turnoActual: 0,
    cancionActual: null,
    revelada: false,
    indiceSeleccionado: null,
    resultado: null,
    creadoEn: Date.now()
  };

  await setDoc(doc(db, SALAS_COL, codigo), sala);
  guardarSession(codigo, hostNombre, sessionId);
  return { codigo, sessionId };
}

export async function unirseASala(codigo, nombre) {
  const db = await getDb();
  const { doc, getDoc, updateDoc } = await import('firebase/firestore');

  const ref = doc(db, SALAS_COL, codigo);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: 'Sala no encontrada' };

  const data = snap.data();
  const jugadorExistente = data.jugadores.find(j => j.nombre.toLowerCase() === nombre.toLowerCase());

  if (jugadorExistente) {
    const session = obtenerSession();
    if (session && session.codigo === codigo && session.nombre.toLowerCase() === nombre.toLowerCase() && session.sessionId === jugadorExistente.sessionId) {
      return { ok: true, reconexion: true, sessionId: session.sessionId };
    }
    return { error: 'Ese nombre ya está en uso' };
  }

  if (data.estado !== 'esperando') return { error: 'La partida ya comenzó' };
  if (data.jugadores.length >= 8) return { error: 'Sala llena (máx 8)' };

  const sessionId = generarSessionId();
  const nuevoJugador = { nombre, linea: [], puntos: 0, saltos: 3, sessionId };

  const jugadoresActualizados = [...data.jugadores, nuevoJugador];
  await updateDoc(ref, { jugadores: jugadoresActualizados });

  guardarSession(codigo, nombre, sessionId);
  return { ok: true, reconexion: false, sessionId };
}

export async function escucharSala(codigo, callback) {
  const db = await getDb();
  const { doc, onSnapshot } = await import('firebase/firestore');
  const ref = doc(db, SALAS_COL, codigo);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function actualizarSala(codigo, datos) {
  const db = await getDb();
  const { doc, updateDoc } = await import('firebase/firestore');
  const ref = doc(db, SALAS_COL, codigo);
  await updateDoc(ref, datos);
}

export async function obtenerSala(codigo) {
  const db = await getDb();
  const { doc, getDoc } = await import('firebase/firestore');
  const ref = doc(db, SALAS_COL, codigo);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function eliminarSala(codigo) {
  const db = await getDb();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, SALAS_COL, codigo));
  limpiarSession();
}

export async function salirDeSala(codigo, nombre) {
  const db = await getDb();
  const { doc, getDoc, updateDoc, deleteDoc } = await import('firebase/firestore');

  const ref = doc(db, SALAS_COL, codigo);
  const snap = await getDoc(ref);
  if (!snap.exists()) { limpiarSession(); return; }

  const data = snap.data();

  if (data.host === nombre && data.estado === 'esperando') {
    await deleteDoc(ref);
    limpiarSession();
    return;
  }

  const jugadoresActualizados = data.jugadores.filter(j => j.nombre !== nombre);

  if (jugadoresActualizados.length === 0) {
    await deleteDoc(ref);
    limpiarSession();
    return;
  }

  let nuevoTurno = data.turnoActual;
  const idxSaliente = data.jugadores.findIndex(j => j.nombre === nombre);

  if (data.estado === 'jugando') {
    if (idxSaliente < nuevoTurno) {
      nuevoTurno = nuevoTurno - 1;
    } else if (idxSaliente === nuevoTurno) {
      nuevoTurno = nuevoTurno % jugadoresActualizados.length;
    }
    if (nuevoTurno >= jugadoresActualizados.length) {
      nuevoTurno = 0;
    }
  }

  if (jugadoresActualizados.length <= 1 && data.estado === 'jugando') {
    await deleteDoc(ref);
    limpiarSession();
    return;
  }

  await updateDoc(ref, {
    jugadores: jugadoresActualizados,
    turnoActual: nuevoTurno,
    host: jugadoresActualizados[0].nombre
  });

  limpiarSession();
}
