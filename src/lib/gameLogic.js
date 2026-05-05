import {
    obtenerSugerencias
} from './firestore.js';
import cancionesLocal from '../data/clasicos.json';

const DEV_MODE = typeof window !== 'undefined' && window.location.hostname === 'localhost';

let cancionesCargadas = null;
const JUGADAS_KEY = 'hitster_jugadas';
const MAX_JUGADAS = 700;

function leerJugadas() {
    try {
        const raw = localStorage.getItem(JUGADAS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function guardarJugada(titulo, artista) {
    const jugadas = leerJugadas();
    const key = `${titulo.toLowerCase()}|${artista.toLowerCase()}`;
    if (!jugadas.includes(key)) {
        jugadas.push(key);
        if (jugadas.length > MAX_JUGADAS) jugadas.shift();
        try {
            localStorage.setItem(JUGADAS_KEY, JSON.stringify(jugadas));
        } catch {}
    }
}

export {
    guardarJugada
}; // 1 hora

export async function cargarCanciones() {
    if (cancionesCargadas) return cancionesCargadas;

    // En desarrollo, usar canciones de anime para pruebas
    if (DEV_MODE) {
        try {
            const cancionesTest = (await import('../data/anime-test.json')).default;
            cancionesCargadas = [...cancionesTest];
            return cancionesCargadas;
        } catch (e) {
            console.warn('anime-test.json no encontrado, usando clasicos.json');
        }
    }

    // Siempre partir del JSON local (tiene rutas de audio/portada locales)
    cancionesCargadas = [...cancionesLocal];

    // Agregar sugerencias de Firestore (no tienen audio local, se busca en Deezer al reproducir)
    try {
        const sugerencias = await obtenerSugerencias();
        if (sugerencias.length > 0) {
            // Evitar duplicados con las locales
            const localesKey = new Set(cancionesCargadas.map(c => c.titulo.toLowerCase() + '|' + c.artista.toLowerCase()));
            const nuevas = sugerencias.filter(s => !localesKey.has(s.titulo.toLowerCase() + '|' + s.artista.toLowerCase()));
            cancionesCargadas = [...cancionesCargadas, ...nuevas];
        }
    } catch (e) {
        console.warn('Error cargando sugerencias de Firestore:', e);
    }

    return cancionesCargadas;
}

export function obtenerGeneros(canciones) {
    const generos = [...new Set(canciones.map(c => c.genero))];
    return generos.sort();
}

export function crearMazo(canciones, generosSeleccionados = []) {
    let filtradas = [...canciones];
    if (generosSeleccionados.length > 0) {
        filtradas = filtradas.filter(c => generosSeleccionados.includes(c.genero));
    }

    const jugadas = leerJugadas();
    const frescas = filtradas.filter(c => !jugadas.includes(`${c.titulo.toLowerCase()}|${c.artista.toLowerCase()}`));
    const repetidas = filtradas.filter(c => jugadas.includes(`${c.titulo.toLowerCase()}|${c.artista.toLowerCase()}`));

    // Frescas primero (barajadas), repetidas al final (barajadas) como respaldo
    return [
        ...repetidas.sort(() => Math.random() - 0.5),
        ...frescas.sort(() => Math.random() - 0.5)
    ];
}

export function crearJugadores(nombresInput) {
    return nombresInput.map((n, i) => ({
        nombre: n.trim() || `Jugador ${i + 1}`,
        linea: [],
        puntos: 0,
        saltos: 3
    }));
}

export function validarPosicion(linea, indice, anio) {
    const limIzq = indice === 0 ? -Infinity : linea[indice - 1].year;
    const limDer = indice === linea.length ? Infinity : linea[indice].year;
    return anio >= limIzq && anio <= limDer;
}

export function insertarEnLinea(linea, indice, carta) {
    const nueva = [...linea];
    nueva.splice(indice, 0, carta);
    return nueva;
}