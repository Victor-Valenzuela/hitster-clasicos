<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { obtenerFrecuencias, estaConectado } from "../lib/visualizer.js";
  const dispatch = createEventDispatcher();

  export let cancionActual = null;
  export let revelada = false;
  export let cargandoAudio = false;
  export let isPlaying = false;
  export let resultado = null;
  export let indiceSeleccionado = null;
  export let nombreJugador = "";
  export let esMultijugador = false;
  export let saltosRestantes = 0;
  export let restantes = 0;
  export let audioPlayer = null;
  export let esOriginal = false;

  const NUM_BARRAS = 32;
  let barElements = [];
  let animId;

  const angulos = Array.from(
    { length: NUM_BARRAS },
    (_, i) => (i / NUM_BARRAS) * 360,
  );

  function actualizarBarras() {
    animId = requestAnimationFrame(actualizarBarras);

    if (!isPlaying || !estaConectado()) {
      barElements.forEach((el) => {
        if (el) {
          el.style.height = "6px";
          el.style.opacity = "0.15";
          el.style.boxShadow = "none";
        }
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
      const h = 6 + val * 30;
      el.style.height = h + "px";
      el.style.opacity = (0.3 + val * 0.7).toString();
      el.style.boxShadow = val > 0.5 ? "0 0 8px #bc13fe80" : "none";
    }
  }

  onMount(() => { actualizarBarras(); });
  onDestroy(() => { if (animId) cancelAnimationFrame(animId); });
</script>

<div class="relative mb-8 lg:mb-0">
  {#if !cancionActual}
    <div class="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-8 border-b-8 border-slate-200 flex items-center justify-center min-h-[300px]">
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  {:else}
  <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl"></div>

  <div class="relative bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-8 border-b-8 border-slate-200">
    <div class="flex justify-between items-center mb-6">
      <span class="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
        {#if esMultijugador}Tú turno{:else}Adivina la fecha{/if}
      </span>
      <span class="text-slate-300 font-bold text-xs italic">Restan: {restantes}</span>
    </div>

    <div class="flex flex-col items-center min-h-[250px] justify-center text-center">
      {#if cargandoAudio}
        <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      {:else if !revelada}
        <div class="circular-visualizer">
          {#each angulos as angle, i}
            <div bind:this={barElements[i]} class="cv-bar" style="--angle: {angle}deg;"></div>
          {/each}
          <div class="cv-center">
            <div class="relative">
              <div class="text-9xl">📻</div>
              <button
                on:click={() => dispatch("toggle")}
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
          <p class="text-indigo-500 font-black uppercase tracking-widest text-[10px] mt-3">Escuchando fragmento...</p>
        {:else}
          <p class="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-3">🎵 Escuchar fragmento</p>
        {/if}
      {:else}
        <div class="animate-in flex flex-col items-center">
          <img src={cancionActual.portada} alt="Cover" class="w-32 h-32 rounded-3xl shadow-2xl mb-6 border-4 border-white" />
          <h2 class="text-3xl font-black text-slate-800 leading-tight mb-1">{cancionActual.titulo}</h2>
          <p class="text-indigo-500 font-bold text-lg mb-8 uppercase tracking-wide">{cancionActual.artista}</p>
          <div class="bg-pink-500 text-white text-5xl font-black px-10 py-4 rounded-[24px] shadow-xl rotate-3 inline-block">{cancionActual.year}</div>
        </div>
      {/if}
    </div>

    {#if resultado}
      <div class="animate-in mt-6 text-center font-black text-xl {resultado === 'correcto' ? 'text-emerald-500' : 'text-red-500'}">
        {resultado === "correcto" ? "¡Correcto! 🎉" : `¡Error! Era de ${cancionActual.year} 😬`}
      </div>
    {:else if !revelada && !cargandoAudio}
      <p class="mt-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">👇 Elige un espacio en tu colección</p>
    {/if}

    <div class="mt-6 flex flex-col gap-2">
      {#if !revelada}
        <button on:click={() => dispatch("validar")} disabled={indiceSeleccionado === null}
          class="w-full bg-indigo-600 text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:translate-y-1 disabled:opacity-30 disabled:grayscale">
          CONFIRMAR POSICIÓN
        </button>
        {#if !cargandoAudio && saltosRestantes > 0}
          <button on:click={() => dispatch("saltar")}
            class="w-full bg-slate-200 text-slate-500 py-3 rounded-2xl text-sm font-black hover:bg-slate-300 transition-all active:translate-y-1">
            {#if esOriginal}
              ⏭️ SALTAR (<img src="/images/casino.png" alt="ficha" class="inline w-4 h-4" style="vertical-align: middle; margin-top: -2px;" />{saltosRestantes})
            {:else}
              ⏭️ SALTAR CANCIÓN ({saltosRestantes})
            {/if}
          </button>
        {/if}
      {:else}
        <button on:click={() => dispatch("continuar")}
          class="w-full {resultado === 'correcto' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' : 'bg-red-500 hover:bg-red-600 shadow-red-100'} text-white py-5 rounded-2xl text-xl font-black shadow-lg transition-all active:translate-y-1">
          {resultado === "correcto" ? "¡GENIAL! SIGUIENTE" : "SIGUIENTE"}
        </button>
      {/if}
    </div>
  </div>
  {/if}
</div>