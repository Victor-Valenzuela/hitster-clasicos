<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { buscarAudioDeezer } from "../../lib/audio.js";
  const dispatch = createEventDispatcher();

  export let desafiante = "";
  export let nombreJugadorActivo = "";
  export let cancion = {};
  export let lineaDesafiante = [];
  export let esHitster = false;

  let inputArtista = "";
  let inputCancion = "";
  let indiceSeleccionado = null;
  let audioEl;
  let isPlaying = false;
  let cargandoAudio = true;

  $: camposVacios = esHitster ? false : (!inputArtista.trim() && !inputCancion.trim());

  onMount(async () => {
    // Cargar audio de la canción
    let src = cancion.previewUrl || null;
    if (!src || !src.startsWith('/audio/')) {
      const datos = await buscarAudioDeezer(cancion.titulo, cancion.artista);
      if (datos) src = datos.previewUrl;
    }
    if (src && audioEl) {
      audioEl.src = src;
    }
    cargandoAudio = false;
  });

  onDestroy(() => {
    if (audioEl) { audioEl.pause(); }
  });

  function toggleAudio() {
    if (!audioEl || !audioEl.src) return;
    if (isPlaying) {
      audioEl.pause();
      isPlaying = false;
    } else {
      audioEl.play().catch(() => {});
      isPlaying = true;
    }
  }

  function confirmar() {
    if (indiceSeleccionado === null || camposVacios) return;
    if (audioEl) audioEl.pause();
    dispatch("responder", { inputArtista, inputCancion, indiceSeleccionado });
  }
</script>

<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
  <div class="bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-4 my-4">
    <audio bind:this={audioEl} on:ended={() => isPlaying = false} crossorigin="anonymous"></audio>

    <h3 class="text-white font-bold text-center text-lg">
      {#if esHitster}🎯 ¡Tu turno HITSTER!{:else}🎯 ¡Tu desafío!{/if}
    </h3>
    <p class="text-slate-300 text-xs text-center">
      {#if esHitster}
        <span class="text-amber-400 font-bold">{nombreJugadorActivo}</span> falló. Ubica la carta en la posición correcta de su línea para robártela.
      {:else}
        {nombreJugadorActivo} falló. Ubica la carta en tu línea y adivina artista o canción para quedártela.
      {/if}
    </p>

    <!-- Botón de play -->
    <div class="flex justify-center">
      {#if cargandoAudio}
        <div class="w-8 h-8 border-2 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div>
      {:else}
        <button
          on:click={toggleAudio}
          class="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 font-bold px-5 py-2 rounded-xl text-sm transition-all active:scale-95 border border-yellow-600/40"
        >
          {#if isPlaying}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pausar
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Escuchar canción
          {/if}
        </button>
      {/if}
    </div>

    <div>
      <label class="text-slate-400 text-xs font-bold block mb-2">
        {#if esHitster}📍 Ubica en la línea de <span class="text-amber-400 font-bold">{nombreJugadorActivo}</span>{:else}📍 Ubica en tu línea de tiempo{/if}
      </label>
      <div class="flex flex-wrap gap-2 justify-center items-stretch">
        {#each { length: lineaDesafiante.length + 1 } as _, i}
          <button
            on:click={() => (indiceSeleccionado = i)}
            class="w-14 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all
              {indiceSeleccionado === i
                ? 'border-yellow-400 bg-yellow-500/20 scale-105 shadow-lg shadow-yellow-500/20'
                : 'border-white/30 bg-white/5 hover:border-yellow-400/60'}"
          >
            {#if indiceSeleccionado === i}
              <span class="text-2xl">❓</span>
              <span class="text-[8px] font-black text-yellow-400">¿AQUÍ?</span>
            {:else}
              <span class="text-white/40 text-xl">+</span>
            {/if}
          </button>
          {#if i < lineaDesafiante.length}
            <div class="w-14 h-20 rounded-xl bg-white/90 flex flex-col items-center justify-center p-1 text-center shadow-md border-b-2 border-slate-200">
              {#if lineaDesafiante[i].portada}
                <img src={lineaDesafiante[i].portada} alt="" class="w-8 h-8 rounded-md object-cover" />
              {/if}
              <span class="text-indigo-600 font-black text-xs leading-none mt-1">{lineaDesafiante[i].year}</span>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    {#if !esHitster}
    <div>
      <label class="text-slate-400 text-xs font-bold">Artista / Grupo</label>
      <input
        bind:value={inputArtista}
        placeholder="¿Quién canta?"
        class="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
      />
    </div>

    <div>
      <label class="text-slate-400 text-xs font-bold">Nombre de la canción</label>
      <input
        bind:value={inputCancion}
        placeholder="¿Cómo se llama?"
        class="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
      />
    </div>
    {/if}

    <button
      on:click={confirmar}
      disabled={indiceSeleccionado === null || camposVacios}
      class="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-white/5 disabled:text-white/30 text-white font-bold py-3 rounded-xl transition-all text-sm"
    >
      {#if esHitster}Confirmar posición{:else}Confirmar desafío{/if}
    </button>
  </div>
</div>