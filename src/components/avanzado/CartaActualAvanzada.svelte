<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { obtenerFrecuencias, estaConectado } from "../../lib/visualizer.js";
  import { validarTexto, calcularPoder } from "../../lib/poderes.js";
  const dispatch = createEventDispatcher();

  export let cancionActual = null;
  export let revelada = false;
  export let cargandoAudio = false;
  export let isPlaying = false;
  export let resultado = null;
  export let indiceSeleccionado = null;
  export let nombreJugador = "";
  export let restantes = 0;
  export let audioPlayer = null;
  export let modoDificilActivo = false;
  export let desafioEnCurso = false;
  export let dobleONadaActivo = false;
  export let motivoFallo = null;
  export let resultadoDesafio = null;
  export let desafianteNombre = '';
  export let esOriginal = false;
  export let fichasJugador = 0;

  $: requiereBonus = modoDificilActivo || dobleONadaActivo;
  $: bonusVacio = !inputArtista.trim() && !inputCancion.trim();

  // 'escuchando' | 'bonus' | 'esperando' | 'revelada'
  let fase = "escuchando";
  let inputArtista = "";
  let inputCancion = "";
  let resultadoBonus = null;
  let ultimoTitulo = "";
  let bloqueado = false;

  const NUM_BARRAS = 32;
  let barElements = [];
  let animId;
  const angulos = Array.from(
    { length: NUM_BARRAS },
    (_, i) => (i / NUM_BARRAS) * 360,
  );

  function checkReset(titulo) {
    if (titulo && titulo !== ultimoTitulo) {
      ultimoTitulo = titulo;
      fase = "escuchando";
      inputArtista = "";
      inputCancion = "";
      resultadoBonus = null;
      bloqueado = false;
      enviado = false;
    }
  }
  $: checkReset(cancionActual?.titulo);

  $: if (revelada && fase !== "revelada") {
    fase = "revelada";
  }

  onDestroy(() => {
    if (animId) cancelAnimationFrame(animId);
  });

  function actualizarBarras() {
    animId = requestAnimationFrame(actualizarBarras);
    if (!isPlaying || !estaConectado()) {
      barElements.forEach((el) => {
        if (el) { el.style.height = "6px"; el.style.opacity = "0.15"; el.style.boxShadow = "none"; }
      });
      return;
    }
    const freqs = obtenerFrecuencias();
    if (!freqs) return;
    const step = Math.floor(freqs.length / NUM_BARRAS);
    for (let i = 0; i < NUM_BARRAS; i++) {
      const el = barElements[i];
      if (!el) continue;
      const val = freqs[i * step] / 255;
      el.style.height = 6 + val * 30 + "px";
      el.style.opacity = (0.3 + val * 0.7).toString();
      el.style.boxShadow = val > 0.5 ? "0 0 8px #bc13fe80" : "none";
    }
  }

  onMount(() => { actualizarBarras(); });

  function toggleAudio() {
    if (audioPlayer) {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play().catch(() => {});
      }
    }
    dispatch("toggle");
  }

  function irABonus() {
    // En modo Original con 5 fichas, saltar bonus y confirmar directo
    if (esOriginal && fichasJugador >= 5) {
      bloqueado = true;
      fase = "esperando";
      enviado = true;
      dispatch("respondiendo");
      dispatch("validar", { acertoArtista: false, acertoCancion: false, poderGanado: 0 });
      return;
    }
    bloqueado = true;
    fase = "bonus";
    dispatch("respondiendo");
  }

  let enviado = false;

  function confirmarBonus() {
    const acertoArtista = validarTexto(inputArtista, cancionActual.artista);
    const acertoCancion = validarTexto(inputCancion, cancionActual.titulo);
    const poderGanado = calcularPoder(true, acertoArtista, acertoCancion);
    resultadoBonus = { acertoArtista, acertoCancion, poderGanado };
    bloqueado = false;
    enviado = true;
    fase = "esperando";
    dispatch("validar", { acertoArtista, acertoCancion, poderGanado });
  }
</script>

<div class="relative mb-8 lg:mb-0">
  <div
    class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl"
  ></div>

  <div
    class="relative bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-8 border-b-8 border-slate-200"
  >
    <div class="flex justify-between items-center mb-6">
      <span
        class="bg-purple-100 text-purple-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter"
      >
        ⚡ Tu turno
      </span>
      <span class="text-slate-300 font-bold text-xs italic"
        >Restan: {restantes}</span
      >
    </div>

    <div
      class="flex flex-col items-center min-h-[250px] justify-center text-center"
    >
      {#if cargandoAudio}
        <div
          class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"
        ></div>
      {:else if fase === "escuchando"}
        <div class="circular-visualizer">
          {#each angulos as angle, i}
            <div bind:this={barElements[i]} class="cv-bar" style="--angle: {angle}deg;"></div>
          {/each}
          <div class="cv-center">
            <div class="relative">
              <div class="text-9xl">📻</div>
              <button
                on:click={toggleAudio}
                class="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-3 rounded-full shadow-2xl hover:bg-pink-500 transition-colors border-4 border-white"
              >
                {#if isPlaying}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {/if}
              </button>
            </div>
          </div>
        </div>
        {#if isPlaying}
          <p
            class="text-indigo-500 font-black uppercase tracking-widest text-[10px] mt-3"
          >
            Escuchando fragmento...
          </p>
        {:else}
          <p
            class="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-3"
          >
            🎵 Escuchar fragmento
          </p>
        {/if}
      {:else if fase === "bonus"}
        <div class="animate-in w-full space-y-2">
          <h3 class="text-slate-700 font-black text-xs">
            {#if modoDificilActivo && dobleONadaActivo}
              🔥🎵 Modo difícil + Doble o nada — ¡Debes acertar al menos uno!
            {:else if modoDificilActivo}
              🔥 Modo difícil — Debes acertar al menos uno
            {:else if dobleONadaActivo}
              🎵 Doble o nada — Acierta para ganar 2 puntos
            {:else}
              {#if esOriginal}
                <img src="/images/casino.png" alt="ficha" class="inline w-5 h-5" style="vertical-align: middle; margin-top: -2px;" /> Adivina Artista y Canción para ganar 1 ficha
              {:else}
                ⚡ ¡Bonus! Adivina para ganar poderes
              {/if}
            {/if}
          </h3>
          <button
            on:click={toggleAudio}
            class="mx-auto flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-all"
          >
            {#if isPlaying}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {/if}
          </button>
          <div class="text-left">
            <label class="text-slate-500 text-xs font-bold"
              >Artista / Grupo</label
            >
            <input
              bind:value={inputArtista}
              placeholder="¿Quién canta?"
              class="w-full bg-slate-100 text-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div class="text-left">
            <label class="text-slate-500 text-xs font-bold"
              >Nombre de la canción</label
            >
            <input
              bind:value={inputCancion}
              placeholder="¿Cómo se llama?"
              class="w-full bg-slate-100 text-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      {:else if fase === "esperando"}
        <div class="animate-in flex flex-col items-center gap-4">
          <div class="text-6xl animate-hourglass">⏳</div>
          <p class="text-slate-500 font-black text-sm uppercase tracking-wider">Esperando...</p>
        </div>
      {:else if fase === "revelada"}
        <div class="animate-in flex flex-col items-center">
          <img
            src={cancionActual.portada}
            alt="Cover"
            class="w-24 h-24 rounded-2xl shadow-2xl mb-3 border-4 border-white"
          />
          <h2 class="text-2xl font-black text-slate-800 leading-tight mb-1">
            {cancionActual.titulo}
          </h2>
          <p
            class="text-indigo-500 font-bold text-sm mb-3 uppercase tracking-wide"
          >
            {cancionActual.artista}
          </p>
          <div
            class="bg-pink-500 text-white text-3xl font-black px-8 py-3 rounded-[20px] shadow-xl rotate-3 inline-block"
          >
            {cancionActual.year}
          </div>
          {#if resultadoBonus}
            <div class="mt-4 flex gap-2 flex-wrap justify-center">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold {resultadoBonus.acertoArtista
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-500'}"
              >
                Artista: {resultadoBonus.acertoArtista ? "✅" : "❌"}
              </span>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold {resultadoBonus.acertoCancion
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-500'}"
              >
                Canción: {resultadoBonus.acertoCancion ? "✅" : "❌"}
              </span>
              {#if resultadoBonus.poderGanado > 0 && resultado === 'correcto'}
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600"
                >
                  {#if esOriginal}
                    {resultadoBonus.acertoArtista && resultadoBonus.acertoCancion ? '+1' : '+0'}<img src="/images/casino.png" alt="ficha" class="inline w-4 h-4" style="vertical-align: middle; margin-top: -2px;" />
                  {:else}
                    +{resultadoBonus.poderGanado}⚡
                  {/if}
                </span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if resultado && !desafioEnCurso}
      <div class="animate-in mt-3 text-center font-black text-lg">
        {#if resultado === "correcto"}
          <span class="text-emerald-500">¡Correcto! 🎉</span>
        {:else if motivoFallo === "modoDificil"}
          <span class="text-red-500">¡Año correcto, pero no acertaste artista ni canción! 🔥</span>
        {:else if motivoFallo === "dobleONada"}
          <span class="text-red-500">¡Año correcto, pero no acertaste artista ni canción! 🎵 Pierdes una carta</span>
        {:else if motivoFallo === "ano+dobleONada"}
          <span class="text-red-500">¡Error! Era de {cancionActual.year} 😬 Pierdes una carta por el doble o nada</span>
        {:else}
          <span class="text-red-500">¡Error! Era de {cancionActual.year} 😬</span>
        {/if}
      </div>
      {#if resultadoDesafio}
        <div class="mt-3 text-center text-sm font-bold {resultadoDesafio === 'acierto' ? 'text-emerald-600' : 'text-slate-500'}">
          {resultadoDesafio === 'acierto'
            ? `🎯 ${desafianteNombre} acertó el desafío y se quedó la carta`
            : `🎯 ${desafianteNombre} también falló el desafío`}
        </div>
      {/if}
    {:else if resultado && desafioEnCurso}
      <div class="animate-in mt-6 text-center">
        <p class="font-black text-xl text-red-500">¡Fallaste!</p>
        <p class="text-amber-600 font-bold text-sm mt-2">🎯 {desafianteNombre} está intentando el desafío...</p>
      </div>
    {:else if fase === "escuchando" && !cargandoAudio}
      <p
        class="mt-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
      >
        👇 Elige un espacio en tu colección
      </p>
    {/if}

    <div class="mt-3 flex flex-col gap-2">
      {#if fase === "escuchando" && !revelada}
        {#if indiceSeleccionado !== null}
          <button
            on:click={irABonus}
            class="w-full bg-purple-600 text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:translate-y-1"
          >
            {#if esOriginal && fichasJugador >= 5}
              CONFIRMAR POSICIÓN
            {:else if esOriginal}
              <img src="/images/casino.png" alt="ficha" class="inline w-5 h-5" style="vertical-align: middle; margin-top: -2px;" /> ABRIR BONUS
            {:else}
              ⚡ ABRIR BONUS
            {/if}
          </button>
        {:else}
          <button
            disabled
            class="w-full bg-indigo-600 text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-indigo-100 opacity-30 grayscale"
          >
            CONFIRMAR POSICIÓN
          </button>
        {/if}
      {:else if fase === "bonus"}
        <button
          on:click={confirmarBonus}
          disabled={(requiereBonus && bonusVacio) || enviado}
          class="w-full bg-purple-600 text-white py-4 rounded-2xl text-lg font-black shadow-lg hover:bg-purple-700 transition-all active:translate-y-1 disabled:opacity-30 disabled:grayscale"
        >
          {enviado ? 'ESPERANDO...' : 'CONFIRMAR RESPUESTA'}
        </button>
      {:else if fase === "revelada" && resultado}
        {#if !desafioEnCurso}
        <button
          on:click={() => dispatch("continuar")}
          class="w-full {resultado === 'correcto'
            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'
            : 'bg-red-500 hover:bg-red-600 shadow-red-100'} text-white py-3 rounded-2xl text-lg font-black shadow-lg transition-all active:translate-y-1"
        >
          {resultado === "correcto" ? "¡GENIAL! CONTINUAR" : "¡VAYA! SIGUIENTE"}
        </button>
        {/if}
      {/if}
    </div>
  </div>
</div>
