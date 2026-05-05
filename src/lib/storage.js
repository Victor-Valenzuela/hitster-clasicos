const STORAGE_KEY = 'hitster_partida';

export function guardarPartida(estado) {
  try {
    const data = {
      pantalla: estado.pantalla,
      jugadores: estado.jugadores,
      turnoActual: estado.turnoActual,
      mazo: estado.mazo,
      cancionActual: estado.cancionActual,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.error('Error guardando partida:', e); }
}

export function cargarPartida() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error cargando partida:', e);
    return null;
  }
}

export function borrarPartida() {
  localStorage.removeItem(STORAGE_KEY);
}
