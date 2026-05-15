<script>
  import { onMount } from 'svelte';
  import { crearControlAudio, buscarAudioDeezer } from '../lib/audio.js';
  import { cargarCanciones, obtenerGeneros, crearMazo, crearJugadores, validarPosicion, insertarEnLinea, guardarJugada } from '../lib/gameLogic.js';
  import { guardarPartida, cargarPartida, borrarPartida } from '../lib/storage.js';
  import { sonidoAcierto, sonidoFallo, sonidoSaltar } from '../lib/sfx.js';
  import { conectarAudio, resumirContexto } from '../lib/visualizer.js';
  import { crearSala, unirseASala, escucharSala, actualizarSala, eliminarSala, limpiarSalasViejas, obtenerSession, limpiarSession, salirDeSala } from '../lib/salas.js';

  import PantallaInicio from './PantallaInicio.svelte';
  import PantallaSetup from './PantallaSetup.svelte';
  import PantallaFin from './PantallaFin.svelte';
  import CartaActual from './CartaActual.svelte';
  import Coleccion from './Coleccion.svelte';
  import Marcador from './Marcador.svelte';
  import FormularioSugerencia from './FormularioSugerencia.svelte';
  import PantallaOnline from './PantallaOnline.svelte';
  import PantallaLobby from './PantallaLobby.svelte';
  import JuegoOnline from './JuegoOnline.svelte';
  import JuegoBingo from './bingo/JuegoBingo.svelte';

  let pantalla = 'inicio';
  let jugadores = [];
  let turnoActual = 0;
  let mazo = [];
  let cancionActual = null;
  let revelada = false;
  let cargandoAudio = false;
  let isPlaying = false;
  let indiceSeleccionado = null;
  let resultado = null;
  let hayPartidaGuardada = false;
  let transicion = false;
  let todasCanciones = [];
  let todosGeneros = [];
  let cargandoCanciones = true;
  let pantallaAntesSugerencia = 'inicio';

  function generarCartonBingo() {
    const categorias = ['titulo', 'anio', 'artista', 'decada', 'antes_2000'];
    // 5 de cada categoría = 25 casillas
    const casillas = [];
    for (const cat of categorias) {
      for (let i = 0; i < 5; i++) {
        casillas.push({ categoria: cat, marcada: false });
      }
    }
    // Barajar
    for (let i = casillas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [casillas[i], casillas[j]] = [casillas[j], casillas[i]];
    }
    return casillas;
  }

  // Online
  let codigoSala = '';
  let miNombre = '';
  let esHost = false;
  let salaData = null;
  let unsubSala;
  let ultimoModo = '';
  let onlineRef;

  let audioPlayer;
  $: jugadorActivo = jugadores[turnoActual] || null;
  $: esMultijugador = jugadores.length > 1;
  $: audio = crearControlAudio(() => audioPlayer, (v) => isPlaying = v);

  onMount(async () => {
    hayPartidaGuardada = !!cargarPartida();
    todasCanciones = await cargarCanciones();
    todosGeneros = obtenerGeneros(todasCanciones);
    cargandoCanciones = false;

    // Limpiar salas viejas
    limpiarSalasViejas();

    // Check reconexión a sala activa
    const session = obtenerSession();
    if (session) {
      try {
        const res = await unirseASala(session.codigo, session.nombre);
        if (res.ok && res.reconexion) {
          miNombre = session.nombre;
          codigoSala = session.codigo;
          esHost = false;
          pantalla = 'lobby';
          unsubSala = await escucharSala(codigoSala, (data) => {
            salaData = data;
            esHost = data.host === miNombre;
            if (data.estado === 'jugando' || data.estado === 'tutorial') { pantalla = 'juegoOnline'; ultimoModo = data.modo || ''; }
            if (data.estado === 'fin') {
              jugadores = data.jugadores;
              ultimoModo = data.modo || '';
              pantalla = 'fin';
              limpiarSession();
              if (unsubSala) unsubSala();
            }
          });
          return;
        }
      } catch (e) {
        limpiarSession();
      }
    }

    // Check URL params for sala code (QR join)
    const params = new URLSearchParams(window.location.search);
    const salaParam = params.get('sala');
    if (salaParam) {
      codigoSala = salaParam.toUpperCase();
      pantalla = 'online';
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  // === LOCAL GAME FUNCTIONS ===
  function guardar() {
    if (pantalla === 'juego') {
      guardarPartida({ pantalla, jugadores, turnoActual, mazo, cancionActual });
    }
  }

  async function onContinuarPartida() {
    const data = cargarPartida();
    if (!data) return;
    jugadores = data.jugadores;
    turnoActual = data.turnoActual;
    mazo = data.mazo;
    cancionActual = data.cancionActual;
    pantalla = 'juego';
    revelada = false;
    indiceSeleccionado = null;
    resultado = null;
    isPlaying = false;

    if (cancionActual?.previewUrl && audioPlayer) {
      audioPlayer.src = cancionActual.previewUrl;
    } else if (cancionActual && audioPlayer) {
      const datos = await buscarAudioDeezer(cancionActual.titulo, cancionActual.artista);
      if (datos && datos.previewUrl) {
        cancionActual.previewUrl = datos.previewUrl;
        if (!cancionActual.portada && datos.portada) cancionActual.portada = datos.portada;
        audioPlayer.src = datos.previewUrl;
      }
    }
  }

  function onModo() { pantalla = 'setup'; }

  async function onIniciar(e) {
    borrarPartida();
    const { nombres, generos } = e.detail;
    jugadores = crearJugadores(nombres);
    mazo = crearMazo(todasCanciones, generos);
    turnoActual = 0;

    for (const j of jugadores) {
      const carta = mazo.pop();
      j.linea = [carta];
      if (carta) guardarJugada(carta.titulo, carta.artista);
    }

    pantalla = 'juego';
    await prepararNuevaCancion();
  }

  async function prepararNuevaCancion() {
    if (mazo.length === 0) { pantalla = 'fin'; borrarPartida(); return; }
    // Pausar audio anterior
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.removeAttribute('src');
      audioPlayer.load();
    }
    isPlaying = false;
    transicion = true;
    await new Promise(r => setTimeout(r, 300));
    cancionActual = mazo.pop();
    if (cancionActual) guardarJugada(cancionActual.titulo, cancionActual.artista);
    revelada = false;
    indiceSeleccionado = null;
    resultado = null;
    isPlaying = false;
    transicion = false;

    if (cancionActual?.previewUrl && audioPlayer) {
      audioPlayer.src = cancionActual.previewUrl;
    } else if (cancionActual && audioPlayer) {
      cargandoAudio = true;
      const datos = await buscarAudioDeezer(cancionActual.titulo, cancionActual.artista);
      cargandoAudio = false;
      if (datos && datos.previewUrl) {
        cancionActual.previewUrl = datos.previewUrl;
        if (!cancionActual.portada && datos.portada) cancionActual.portada = datos.portada;
        audioPlayer.src = datos.previewUrl;
      }
    }
    guardar();
  }

  function onSeleccionar(e) { if (!revelada) indiceSeleccionado = e.detail; }

  function onValidar() {
    revelada = true;
    const correcto = validarPosicion(jugadorActivo.linea, indiceSeleccionado, cancionActual.year);
    resultado = correcto ? 'correcto' : 'incorrecto';
    if (correcto) sonidoAcierto(); else sonidoFallo();
  }

  const PUNTOS_PARA_GANAR = 10;

  async function onContinuar() {
    if (resultado === 'correcto') {
      jugadorActivo.linea = insertarEnLinea(jugadorActivo.linea, indiceSeleccionado, cancionActual);
      jugadorActivo.puntos += 1;
      jugadores = [...jugadores];
      if (jugadorActivo.puntos >= PUNTOS_PARA_GANAR) {
        pantalla = 'fin'; borrarPartida(); audio.pause(); return;
      }
    }
    if (esMultijugador) turnoActual = (turnoActual + 1) % jugadores.length;
    indiceSeleccionado = null;
    resultado = null;
    await prepararNuevaCancion();
  }

  async function onSaltar() {
    if (jugadorActivo.saltos <= 0) return;
    jugadorActivo.saltos -= 1;
    jugadores = [...jugadores];
    sonidoSaltar();
    audio.pause();
    await prepararNuevaCancion();
  }

  function onReiniciar() {
    pantalla = 'inicio';
    jugadores = [];
    mazo = [];
    cancionActual = null;
    hayPartidaGuardada = false;
    borrarPartida();
    audio.pause();
  }

  // === ONLINE FUNCTIONS ===
  async function onCrearSala(e) {
    miNombre = e.detail;
    esHost = true;
    const mazoOnline = crearMazo(todasCanciones, todosGeneros);
    const resultado = await crearSala(miNombre, todosGeneros, mazoOnline);
    codigoSala = resultado.codigo;
    pantalla = 'lobby';

    unsubSala = await escucharSala(codigoSala, (data) => {
      salaData = data;
      if (data.estado === 'jugando' || data.estado === 'tutorial') { pantalla = 'juegoOnline'; ultimoModo = data.modo || ''; }
      if (data.estado === 'fin') {
        jugadores = data.jugadores;
        ultimoModo = data.modo || ultimoModo;
        pantalla = 'fin';
        limpiarSession();
        if (unsubSala) unsubSala();
      }
    });
  }

  async function onUnirseSala(e) {
    const { nombre, codigo } = e.detail;
    miNombre = nombre;
    codigoSala = codigo;
    esHost = false;

    const res = await unirseASala(codigo, nombre);
    if (res.error) {
      if (onlineRef) onlineRef.mostrarError(res.error);
      return;
    }

    pantalla = 'lobby';
    unsubSala = await escucharSala(codigoSala, (data) => {
      salaData = data;
      if (data.estado === 'jugando' || data.estado === 'tutorial') { pantalla = 'juegoOnline'; ultimoModo = data.modo || ''; }
      if (data.estado === 'fin') {
        jugadores = data.jugadores;
        ultimoModo = data.modo || ultimoModo;
        pantalla = 'fin';
        limpiarSession();
        if (unsubSala) unsubSala();
      }
    });
  }

  async function onIniciarOnline(e) {
    const { generos, modo } = e.detail;
    ultimoModo = modo;
    const mazoFiltrado = crearMazo(todasCanciones, generos);

    const jugadoresActualizados = [...salaData.jugadores];
    for (const j of jugadoresActualizados) {
      const carta = mazoFiltrado.pop();
      j.linea = [carta];
      if (carta) guardarJugada(carta.titulo, carta.artista);
      if (modo === 'avanzado') {
        j.poderes = 1;
        j.tutorialListo = false;
      }
      if (modo === 'original') {
        j.fichas = 2;
        j.tutorialListo = false;
      }
      if (modo === 'bingo') {
        j.linea = [];
        j.carton = generarCartonBingo();
        j.puntos = 0;
      }
    }

    const primeraCancion = mazoFiltrado.pop();
    if (primeraCancion) guardarJugada(primeraCancion.titulo, primeraCancion.artista);

    const categoriasBingo = ['titulo', 'anio', 'artista', 'decada', 'antes_2000'];

    await actualizarSala(codigoSala, {
      estado: (modo === 'avanzado' || modo === 'original') ? 'tutorial' : 'jugando',
      modo,
      jugadores: jugadoresActualizados,
      mazo: mazoFiltrado,
      cancionActual: primeraCancion,
      turnoActual: 0,
      revelada: false,
      indiceSeleccionado: null,
      resultado: null,
      ...(modo === 'bingo' ? { categoriaBingo: categoriasBingo[Math.floor(Math.random() * 5)], faseBingo: 'respondiendo', respuestasBingo: {}, resultadosBingo: {} } : {})
    });
  }

  async function onSalirSala() {
    if (unsubSala) unsubSala();
    await salirDeSala(codigoSala, miNombre);
    codigoSala = '';
    miNombre = '';
    esHost = false;
    salaData = null;
    pantalla = 'inicio';
  }

  async function onFinOnline(e) {
    jugadores = e.detail;
    ultimoModo = salaData?.modo || ultimoModo || '';
    if (unsubSala) unsubSala();
    limpiarSession();
    try { await eliminarSala(codigoSala); } catch (err) {}
    pantalla = 'fin';
  }

  function onSalirJuegoOnline() {
    if (unsubSala) unsubSala();
    codigoSala = '';
    miNombre = '';
    esHost = false;
    salaData = null;
    pantalla = 'inicio';
  }
</script>

<main class="min-h-[100dvh] flex flex-col items-center justify-center p-4 font-sans" role="main" aria-label="Hitster Clásicos">
  <audio bind:this={audioPlayer} on:ended={() => isPlaying = false} crossorigin="anonymous" aria-hidden="true"></audio>

  {#if cargandoCanciones}
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="text-slate-400 font-black text-xs uppercase tracking-widest">Cargando canciones...</p>
    </div>

  {:else if pantalla === 'inicio'}
    <div class="animate-in">
      <PantallaInicio
        {hayPartidaGuardada}
        on:modo={onModo}
        on:continuar={onContinuarPartida}
        on:online={() => pantalla = 'online'}
        on:sugerir={() => { pantallaAntesSugerencia = 'inicio'; pantalla = 'sugerencia'; }}
      />
    </div>

  {:else if pantalla === 'online'}
    <div class="animate-in">
      <PantallaOnline
        bind:this={onlineRef}
        codigoInicial={codigoSala}
        on:crear={onCrearSala}
        on:unirse={onUnirseSala}
        on:volver={() => { codigoSala = ''; pantalla = 'inicio'; }}
      />
    </div>

  {:else if pantalla === 'lobby'}
    <div class="animate-in">
      <PantallaLobby
        codigo={codigoSala}
        jugadores={salaData?.jugadores || []}
        {esHost}
        {todosGeneros}
        modo={salaData?.modo || 'clasico'}
        on:iniciar={onIniciarOnline}
        on:salir={onSalirSala}
      />
    </div>

  {:else if pantalla === 'setup'}
    <div class="animate-in">
      <PantallaSetup {todosGeneros} on:iniciar={onIniciar} on:volver={() => pantalla = 'inicio'} />
    </div>

  {:else if pantalla === 'juego'}
    <button
      on:click={onReiniciar}
      class="fixed top-4 right-4 z-50 bg-red-500 text-white text-sm font-black px-4 py-2 rounded-xl hover:bg-red-600 transition-all active:scale-95"
    >
      🚪 Salir
    </button>
    <div class="w-full max-w-7xl {transicion ? 'opacity-0' : 'opacity-100'}" style="transition: opacity 0.3s ease;">
      {#if esMultijugador}
        <Marcador {jugadores} {turnoActual} />
      {/if}

      <div class="layout-juego">
        <div class="zona-carta">
          <CartaActual
            {cancionActual} {revelada} {cargandoAudio} {isPlaying}
            {resultado} {indiceSeleccionado} {audioPlayer}
            nombreJugador={jugadorActivo?.nombre || ''}
            {esMultijugador}
            restantes={mazo.length}
            saltosRestantes={jugadorActivo?.saltos || 0}
            on:toggle={() => { resumirContexto(); if (audioPlayer) conectarAudio(audioPlayer); audio.toggle(isPlaying); }}
            on:validar={onValidar}
            on:continuar={onContinuar}
            on:saltar={onSaltar}
          />
        </div>

        {#if jugadorActivo}
          <div class="zona-coleccion">
            <Coleccion
              linea={jugadorActivo.linea}
              {cancionActual} {revelada} {indiceSeleccionado} {resultado}
              nombreJugador={jugadorActivo.nombre}
              {esMultijugador}
              on:seleccionar={onSeleccionar}
            />
          </div>
        {/if}
      </div>
    </div>

  {:else if pantalla === 'juegoOnline'}
    {#if ultimoModo === 'bingo'}
      <JuegoBingo {codigoSala} {miNombre} on:fin={onFinOnline} on:salir={onSalirJuegoOnline} />
    {:else}
      <JuegoOnline {codigoSala} {miNombre} on:fin={onFinOnline} on:salir={onSalirJuegoOnline} />
    {/if}

  {:else if pantalla === 'fin'}
    <div class="animate-in">
      <PantallaFin {jugadores} modo={ultimoModo} on:reiniciar={onReiniciar} on:sugerir={() => { pantallaAntesSugerencia = 'fin'; pantalla = 'sugerencia'; }} />
    </div>

  {:else if pantalla === 'sugerencia'}
    <div class="animate-in">
      <FormularioSugerencia on:cerrar={() => pantalla = pantallaAntesSugerencia} />
    </div>
  {/if}
</main>
