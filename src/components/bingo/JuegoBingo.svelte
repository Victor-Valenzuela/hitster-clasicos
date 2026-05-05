<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { crearControlAudio, buscarAudioDeezer } from "../../lib/audio.js";
  import { escucharSala, actualizarSala, obtenerSala, salirDeSala, eliminarSala } from "../../lib/salas.js";
  import { validarTexto } from "../../lib/poderes.js";
  import { sonidoAcierto, sonidoFallo } from "../../lib/sfx.js";
  import { conectarAudio, resumirContexto } from "../../lib/visualizer.js";
  import CartonBingo from "./CartonBingo.svelte";
  import TutorialBingo from "./TutorialBingo.svelte";
  import PantallaFinBingo from "./PantallaFinBingo.svelte";

  const dispatch = createEventDispatcher();

  export let codigoSala = "";
  export let miNombre = "";

  let sala = null;
  let unsub;
  let audioPlayer;
  let isPlaying = false;
  let cargandoAudio = false;
  let audioReady = false;
  let portadaLocal = "";
  let audioSrcLocal = "";
  let cancionCargada = "";
  let inputRespuesta = "";
  let respuestaEnviada = false;
  let mostrarConfirmacion = false;
  let audioListo = false;
  let tiempoRestante = 25;
  let timerInterval = null;
  let viendoCartonDe = "";
  let cartonRef;
  let casillaElegida = null;
  let mostrarTutorialBingo = false;
  let tutorialBingoManual = false;
  let tutorialBingoYaVisto = false;
  let mostrarFinBingo = false;
  let jugadoresFin = [];
  try { tutorialBingoYaVisto = localStorage.getItem('hitster_tutorial_bingo_visto') === 'true'; } catch (e) {}

  $: jugadores = sala?.jugadores || [];
  $: cancionActual = sala?.cancionActual || null;
  $: categoriaBingo = sala?.categoriaBingo || '';
  $: faseBingo = sala?.faseBingo || 'respondiendo'; // 'respondiendo' | 'revelada'
  $: miJugador = jugadores.find(j => j.nombre === miNombre) || null;
  $: miCarton = miJugador?.carton || [];
  $: revelada = faseBingo === 'revelada';
  $: mazoRestante = sala?.mazo?.length || 0;
  $: audio = crearControlAudio(() => audioPlayer, v => isPlaying = v);
  $: listosBingo = sala?.listosBingo || {};
  $: todosListos = jugadores.length > 0 && jugadores.every(j => listosBingo[j.nombre]);
  $: yoListo = listosBingo[miNombre] || false;

  const CATEGORIAS_LABEL = {
    'titulo': '¿Cómo se llama la canción?',
    'anio': '¿En qué año salió?',
    'artista': '¿Quién canta?',
    'decada': '¿De qué década es?',
    'antes_2000': '¿Antes del 2000?',
  };

  function pedirSalir() { mostrarConfirmacion = true; }

  async function borrarSalaBingo() {
    try { await eliminarSala(codigoSala); } catch (err) {}
  }
  function cancelarSalir() { mostrarConfirmacion = false; }
  async function confirmarSalir() {
    mostrarConfirmacion = false;
    audio.pause(); isPlaying = false;
    if (unsub) unsub();
    await salirDeSala(codigoSala, miNombre);
    dispatch("salir");
  }

  async function eliminarSalaYFin(jugadoresData) {
    if (unsub) { unsub(); unsub = null; }
    // No borrar sala aquí — se borra en Juego.svelte onFinOnline
    dispatch("fin", jugadoresData);
  }

  onMount(async () => {
    if (!tutorialBingoYaVisto) {
      mostrarTutorialBingo = true;
    }
    unsub = await escucharSala(codigoSala, (data) => {
      if (!data) { dispatch("salir"); return; }

      const prevTitulo = sala?.cancionActual?.titulo;
      sala = data;

      if (data.estado === "fin") {
        if (unsub) { unsub(); unsub = null; }
        jugadoresFin = data.jugadores;
        mostrarFinBingo = true;
        borrarSalaBingo();
        return;
      }

      // Nueva canción
      if (data.cancionActual?.titulo !== prevTitulo) {
        isPlaying = false;
        portadaLocal = "";
        audioSrcLocal = "";
        cancionCargada = "";
        audioReady = false;
        inputRespuesta = "";
        respuestaEnviada = false;
        audioListo = false;
        casillaElegida = null;
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.removeAttribute("src");
          audioPlayer.load();
        }
        if (data.cancionActual) cargarAudioCancion(data.cancionActual);
      }

      // Auto-play cuando todos están listos
      if (data.listosBingo && data.jugadores.length > 0) {
        const todos = data.jugadores.every(j => data.listosBingo[j.nombre]);
        if (todos && audioReady && !isPlaying && data.faseBingo === 'respondiendo') {
          resumirContexto();
          if (audioPlayer) conectarAudio(audioPlayer);
          audio.toggle(false);
          iniciarTimer();
        }
      }

      // Auto-revelar cuando todos respondieron (resuelve race condition)
      if (data.faseBingo === 'respondiendo' && data.respuestasBingo && data.jugadores.length > 0) {
        const todosResp = data.jugadores.every(j => data.respuestasBingo[j.nombre]);
        if (todosResp) {
          actualizarSala(codigoSala, { faseBingo: 'revelada' });
          detenerTimer();
          audio.pause();
          isPlaying = false;
        }
      }

      // Parar audio al revelar
      if (data.faseBingo === 'revelada' && isPlaying) {
        detenerTimer();
        audio.pause();
        isPlaying = false;
      }
    });
  });

  onDestroy(() => { if (unsub) unsub(); detenerTimer(); });

  async function cargarAudioCancion(cancion) {
    const key = `${cancion.titulo}|${cancion.artista}`;
    if (cancionCargada === key || cargandoAudio) return;
    cargandoAudio = true;
    audioReady = false;
    try {
      let src = cancion.previewUrl || null;
      let portada = cancion.portada || '';
      if (!src || !src.startsWith('/audio/')) {
        const datos = await buscarAudioDeezer(cancion.titulo, cancion.artista);
        if (datos) { src = datos.previewUrl; if (!portada && datos.portada) portada = datos.portada; }
      }
      if (src && audioPlayer) {
        audioSrcLocal = src;
        portadaLocal = portada;
        audioPlayer.src = src;
        cancionCargada = key;
        await new Promise(r => {
          audioPlayer.oncanplaythrough = () => { audioReady = true; r(); };
          audioPlayer.onerror = () => { audioReady = false; r(); };
        });
      }
    } catch (e) { console.error("Error cargando audio:", e); }
    cargandoAudio = false;

    // Si todos ya estaban listos y el audio acaba de cargar, auto-play
    if (audioReady && sala?.listosBingo && sala?.jugadores?.length > 0) {
      const todos = sala.jugadores.every(j => sala.listosBingo[j.nombre]);
      if (todos && !isPlaying && sala.faseBingo === 'respondiendo') {
        resumirContexto();
        if (audioPlayer) conectarAudio(audioPlayer);
        audio.toggle(false);
        iniciarTimer();
      }
    }
  }

  function onToggle() {
    if (!audioReady) return;
    resumirContexto();
    if (audioPlayer) conectarAudio(audioPlayer);
    audio.toggle(isPlaying);
  }

  async function marcarListo() {
    if (audioListo) return;
    audioListo = true;
    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const listos = { ...(salaFresca.listosBingo || {}) };
    listos[miNombre] = true;
    await actualizarSala(codigoSala, { listosBingo: listos });
  }

  function iniciarTimer() {
    if (timerInterval) clearInterval(timerInterval);
    tiempoRestante = 25;
    timerInterval = setInterval(() => {
      tiempoRestante--;
      if (tiempoRestante <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        audio.pause();
        isPlaying = false;
        if (!respuestaEnviada) enviarRespuesta();
      }
    }, 1000);
  }

  function detenerTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  async function enviarRespuesta() {
    if (respuestaEnviada) return;
    respuestaEnviada = true;

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;

    const respuestas = { ...(salaFresca.respuestasBingo || {}) };
    respuestas[miNombre] = inputRespuesta.trim() || '__sin_respuesta__';

    await actualizarSala(codigoSala, { respuestasBingo: respuestas });
  }

  function verificarRespuesta() {
    if (!cancionActual || !categoriaBingo) return false;
    const resp = (sala?.respuestasBingo || {})[miNombre] || '';
    if (!resp) return false;

    switch (categoriaBingo) {
      case 'titulo':
        return validarTexto(resp, cancionActual.titulo);
      case 'artista':
        return validarTexto(resp, cancionActual.artista);
      case 'anio':
        return parseInt(resp) === cancionActual.year;
      case 'decada': {
        const decadaReal = Math.floor(cancionActual.year / 10) * 10;
        const decadaCorta = decadaReal % 100;
        const respLimpio = resp.toLowerCase().replace(/[^0-9]/g, '');
        const respNum = parseInt(respLimpio);
        return respNum === decadaReal || respNum === decadaCorta;
      }
      case 'antes_2000': {
        const respLower = resp.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const esAntes = cancionActual.year < 2000;
        const dijoSi = respLower === 'si' || respLower === 'sí' || respLower === 's';
        const dijoNo = respLower === 'no' || respLower === 'n';
        return (esAntes && dijoSi) || (!esAntes && dijoNo);
      }
      default: return false;
    }
  }

  $: miResultado = revelada ? (verificarRespuesta() ? 'correcto' : 'incorrecto') : null;

  // Guardar resultado en Firestore cuando se revela
  $: if (miResultado && sala?.resultadosBingo?.[miNombre] !== miResultado) {
    guardarResultadoBingo(miResultado);
  }

  async function guardarResultadoBingo(resultado) {
    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;
    const resultados = { ...(salaFresca.resultadosBingo || {}) };
    resultados[miNombre] = resultado;
    await actualizarSala(codigoSala, { resultadosBingo: resultados });
  }

  function verificarVictoriaCarton(carton) {
    for (let f = 0; f < 5; f++) {
      if (carton.slice(f * 5, f * 5 + 5).every(c => c.marcada)) return true;
    }
    for (let c = 0; c < 5; c++) {
      if ([0,1,2,3,4].every(f => carton[f * 5 + c].marcada)) return true;
    }
    if ([0,1,2,3,4].every(i => carton[i * 5 + i].marcada)) return true;
    if ([0,1,2,3,4].every(i => carton[i * 5 + (4 - i)].marcada)) return true;
    return false;
  }

  async function siguienteRonda() {
    detenerTimer();

    const salaFresca = await obtenerSala(codigoSala);
    if (!salaFresca) return;

    const jugAct = salaFresca.jugadores.map(j => ({ ...j, carton: j.carton?.map(c => ({...c})) }));
    const idxJ = jugAct.findIndex(j => j.nombre === miNombre);

    // Marcar casilla seleccionada si acertó (solo en ronda normal, no en desempate)
    if (!salaFresca.desempateBingo && miResultado === 'correcto' && cartonRef) {
      const sel = cartonRef.obtenerCasillaSeleccionada();
      if (sel) {
        jugAct[idxJ].carton[sel.idx].marcada = true;
      }
      cartonRef.limpiarSeleccion();
    }

    // Marcar como listo y guardar si acertó
    const listosSiguiente = { ...(salaFresca.listosSiguiente || {}) };
    listosSiguiente[miNombre] = miResultado === 'correcto' ? 'acierto' : 'fallo';

    const todosListosSig = jugAct.every(j => listosSiguiente[j.nombre]);

    if (!todosListosSig) {
      await actualizarSala(codigoSala, { jugadores: jugAct, listosSiguiente });
      return;
    }

    // Todos listos — resolver ronda
    const categorias = ['titulo', 'anio', 'artista', 'decada', 'antes_2000'];

    // Si estamos en desempate, verificar muerte súbita
    if (salaFresca.desempateBingo && salaFresca.jugadoresDesempate) {
      const empatados = salaFresca.jugadoresDesempate;
      const resultados = salaFresca.resultadosBingo || {};
      const acertaron = empatados.filter(n => resultados[n] === 'correcto');
      const fallaron = empatados.filter(n => resultados[n] === 'incorrecto');

      if (acertaron.length === 1) {
        // Un ganador del desempate
        jugAct.forEach(j => { j.ganadorBingo = j.nombre === acertaron[0]; });
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        return;
        return;
      }

      // Ambos acertaron o ambos fallaron — otra ronda
      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop();
      if (!nuevaCancion) {
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        await eliminarSalaYFin(jugAct);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugAct,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        categoriaBingo: categorias[Math.floor(Math.random() * 5)],
        faseBingo: 'respondiendo',
        respuestasBingo: {},
        resultadosBingo: {},
        listosBingo: {},
        listosSiguiente: {},
        revelada: false,
        desempateBingo: true,
        jugadoresDesempate: acertaron.length > 1 ? acertaron : empatados,
      });
      return;
    }

    // Ronda normal — verificar victoria
    const ganadores = jugAct.filter(j => verificarVictoriaCarton(j.carton));

    if (ganadores.length === 1) {
      await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
      await eliminarSalaYFin(jugAct);
      return;
    }

    if (ganadores.length > 1) {
      // Empate — iniciar desempate
      const nuevoMazo = [...salaFresca.mazo];
      const nuevaCancion = nuevoMazo.pop();
      if (!nuevaCancion) {
        await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
        await eliminarSalaYFin(jugAct);
        return;
      }

      await actualizarSala(codigoSala, {
        jugadores: jugAct,
        cancionActual: nuevaCancion,
        mazo: nuevoMazo,
        categoriaBingo: categorias[Math.floor(Math.random() * 5)],
        faseBingo: 'respondiendo',
        respuestasBingo: {},
        resultadosBingo: {},
        listosBingo: {},
        listosSiguiente: {},
        revelada: false,
        desempateBingo: true,
        jugadoresDesempate: ganadores.map(g => g.nombre),
      });
      return;
    }

    // Sin ganadores — siguiente canción normal
    const nuevoMazo = [...salaFresca.mazo];
    const nuevaCancion = nuevoMazo.pop();

    if (!nuevaCancion) {
      await actualizarSala(codigoSala, { estado: 'fin', jugadores: jugAct });
      await eliminarSalaYFin(jugAct);
      return;
    }

    await actualizarSala(codigoSala, {
      jugadores: jugAct,
      cancionActual: nuevaCancion,
      mazo: nuevoMazo,
      categoriaBingo: categorias[Math.floor(Math.random() * 5)],
      faseBingo: 'respondiendo',
      respuestasBingo: {},
      resultadosBingo: {},
      listosBingo: {},
      listosSiguiente: {},
      revelada: false,
      desempateBingo: false,
      jugadoresDesempate: null,
    });
  }
</script>

<div class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-2 bg-slate-900 border-b border-white/15 gap-1">
  <span class="text-indigo-400 font-black text-sm tracking-widest mobile-only">{codigoSala}</span>
  <span class="text-white font-black text-base desktop-only">🌐 Sala <span class="text-indigo-400 tracking-widest text-lg">{codigoSala}</span></span>

  <span class="text-slate-300 text-xs font-bold truncate max-w-[80px] mobile-only">👤 {miNombre}</span>
  <span class="text-slate-300 text-sm font-bold desktop-only">👤 {miNombre}</span>

  <div class="flex items-center gap-1">
    <button
      on:click={() => { tutorialBingoManual = true; mostrarTutorialBingo = true; }}
      class="bg-indigo-600 text-white text-xs font-black w-7 h-7 rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
    >
      ❓
    </button>
    <button
      on:click={pedirSalir}
      class="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all active:scale-95 mobile-only"
    >
      Salir
    </button>
    <button
      on:click={pedirSalir}
      class="bg-red-500 text-white text-sm font-black px-5 py-2 rounded-xl hover:bg-red-600 transition-all active:scale-95 desktop-only"
    >
      🚪 Salir
    </button>
  </div>
</div>

<div class="w-full max-w-6xl pt-14 px-2">
  <audio bind:this={audioPlayer} on:ended={() => isPlaying = false} crossorigin="anonymous"></audio>

  <!-- Marcador bingo -->
  <div class="flex flex-wrap justify-center gap-2 mb-3">
    {#each jugadores as j}
      <button
        on:click={() => viendoCartonDe = viendoCartonDe === j.nombre ? '' : j.nombre}
        class="px-3 py-1 rounded-xl text-center transition-all
          {j.nombre === miNombre ? 'bg-cyan-600 text-white' : viendoCartonDe === j.nombre ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
      >
        <p class="font-black text-[10px] uppercase tracking-wider truncate max-w-[5rem]">{j.nombre}</p>
      </button>
    {/each}
  </div>

  {#if sala?.desempateBingo}
    <div class="flex justify-center mb-3">
      <div class="bg-amber-600/20 border border-amber-500/40 px-4 py-2 rounded-xl text-center">
        <p class="text-amber-400 font-bold text-sm">⚡ ¡Desempate! Ronda extra entre los empatados</p>
      </div>
    </div>
  {/if}

  <div class="layout-bingo">
  <!-- Cartón bingo (propio o de otro jugador) -->
  <div class="zona-carton">
  {#if viendoCartonDe && viendoCartonDe !== miNombre}
    {@const jugadorVisto = jugadores.find(j => j.nombre === viendoCartonDe)}
    {#if jugadorVisto}
      <div class="mb-4">
        <div class="text-center mb-1">
          <span class="text-indigo-400 text-xs font-bold">Cartón de {viendoCartonDe}</span>
          <button on:click={() => viendoCartonDe = ''} class="text-slate-500 text-[10px] ml-2 hover:text-slate-300">Ver mi cartón</button>
        </div>
        <CartonBingo
          carton={jugadorVisto.carton || []}
          categoriaActual=""
          respuestaEnviada={true}
          resultado={null}
          restan={mazoRestante}
        />
      </div>
    {/if}
  {:else}
    <div class="mb-4">
      <CartonBingo
        bind:this={cartonRef}
        carton={miCarton}
        categoriaActual={categoriaBingo}
        respuestaEnviada={respuestaEnviada}
        resultado={miResultado}
        restan={mazoRestante}
        on:seleccion={(e) => casillaElegida = e.detail}
      />
    </div>
  {/if}
  </div>

  <!-- Card de reproducción + respuesta -->
  <div class="zona-audio">
  <div class="relative mb-4">
    <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-[40px] blur-2xl"></div>
    <div class="relative bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-5 border-b-8 border-slate-200">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-cyan-100 text-cyan-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
          🪩 Bingo
        </span>
        <span class="text-slate-300 font-bold text-xs italic">Restan: {mazoRestante}</span>
      </div>

      <!-- Play button sincronizado -->
      <div class="flex flex-col items-center mb-3">
        {#if !todosListos}
          {#if cargandoAudio}
            <div class="w-10 h-10 border-3 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          {:else if !yoListo}
            <button on:click={marcarListo}
              disabled={!audioReady}
              class="px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-30">
              🎵 Escuchar canción
            </button>
          {:else}
            <p class="text-slate-400 text-xs font-bold">⏳ Esperando a los demás...</p>
          {/if}
        {:else}
          <button on:click={onToggle}
            disabled={revelada}
            class="w-14 h-14 rounded-full bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 transition-all active:scale-95 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">
            {#if isPlaying}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {/if}
          </button>
        {/if}
      </div>

      <!-- Categoría pregunta -->
      {#if categoriaBingo}
        <p class="text-center text-slate-700 font-black text-sm mb-2">
          {CATEGORIAS_LABEL[categoriaBingo]}
        </p>
        {#if todosListos && !revelada}
          <div class="flex justify-center mb-3">
            <span class="text-xs font-black px-3 py-1 rounded-full {tiempoRestante <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}">
              ⏱ {tiempoRestante}s
            </span>
          </div>
        {/if}
      {/if}

      <!-- Input respuesta o resultado -->
      {#if !revelada}
        {#if todosListos}
          <div class="flex gap-2">
            <input
              bind:value={inputRespuesta}
              placeholder="Tu respuesta..."
              disabled={respuestaEnviada}
              class="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400"
            />
            <button
              on:click={enviarRespuesta}
              disabled={!inputRespuesta.trim() || respuestaEnviada}
              class="px-4 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-30"
            >
              {respuestaEnviada ? '⏳' : '✓'}
            </button>
          </div>
          {#if respuestaEnviada}
            <p class="text-center text-slate-400 text-xs mt-2">Esperando a los demás...</p>
          {/if}
        {/if}
      {:else}
        <!-- Resultado revelado -->
        <div class="text-center">
          {#if cancionActual}
            {#if portadaLocal}
              <img src={portadaLocal} alt="" class="w-16 h-16 rounded-xl mx-auto mb-2 shadow-md" />
            {/if}
            <p class="text-slate-800 font-black text-base">{cancionActual.titulo}</p>
            <p class="text-indigo-600 font-bold text-sm">{cancionActual.artista}</p>
            <p class="text-slate-500 font-bold text-xs">{cancionActual.year}</p>
          {/if}
          <p class="mt-2 font-black text-sm {miResultado === 'correcto' ? 'text-emerald-600' : 'text-red-500'}">
            {miResultado === 'correcto' ? '¡Correcto! Marca una casilla' : 'Incorrecto'}
          </p>
          {#if sala?.listosSiguiente?.[miNombre]}
            <p class="mt-3 text-slate-400 text-xs font-bold text-center">⏳ Esperando a los demás...</p>
          {:else if miResultado === 'correcto' && !casillaElegida && !sala?.desempateBingo}
            <p class="mt-3 text-amber-500 text-xs font-bold text-center">👆 Selecciona una casilla antes de continuar</p>
          {:else}
            <button
              on:click={siguienteRonda}
              class="mt-3 w-full bg-cyan-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-cyan-700 transition-all active:scale-95"
            >
              Siguiente canción →
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
  </div>
  </div>
</div>

{#if mostrarConfirmacion}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4">
    <div class="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center">
      <p class="text-white font-bold mb-4">¿Salir de la partida?</p>
      <div class="flex gap-3">
        <button on:click={cancelarSalir} class="flex-1 bg-white/10 text-slate-300 font-bold py-3 rounded-xl text-sm hover:bg-white/20">Cancelar</button>
        <button on:click={confirmarSalir} class="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 active:scale-95">Sí, salir</button>
      </div>
    </div>
  </div>
{/if}

<TutorialBingo
  visible={mostrarTutorialBingo}
  mostrarNoVolver={!tutorialBingoManual}
  on:cerrar={() => { mostrarTutorialBingo = false; tutorialBingoManual = false; }}
/>

{#if mostrarFinBingo}
  <div class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4">
    <PantallaFinBingo
      jugadores={jugadoresFin}
      on:reiniciar={async () => { try { await eliminarSala(codigoSala); } catch(e) {} dispatch('salir'); }}
      on:sugerir={async () => { try { await eliminarSala(codigoSala); } catch(e) {} dispatch('salir'); }}
    />
  </div>
{/if}

<style>
  .layout-bingo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .zona-carton {
    width: 100%;
  }
  .zona-audio {
    width: 100%;
  }

  @media (min-width: 1024px) {
    .layout-bingo {
      flex-direction: row;
      align-items: flex-start;
    }
    .zona-carton {
      flex: 1;
      max-width: 480px;
    }
    .zona-audio {
      flex: 1;
      max-width: 420px;
    }
  }
</style>
