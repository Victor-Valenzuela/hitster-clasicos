<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let visible = false;
  export let mostrarNoVolver = true;

  let slide = 0;
  let noVolver = false;

  $: if (visible) slide = 0;

  const slides = [
    {
      titulo: "MODO BINGO",
      emoji: "🪩",
      contenido: [
        "¡Bienvenido al Hitster Bingo!",
        "Cada jugador recibe un cartón 5x5 con 5 categorías.",
        "🟢 Título — ¿Cómo se llama la canción?",
        "🟡 Año exacto — ¿En qué año salió?",
        "🟣 Artista — ¿Quién canta?",
        "🔵 Década — ¿De qué década es?",
        "🩷 Antes del 2000 — ¿Sí o no?",
        "Todos juegan a la vez, no hay turnos.",
      ]
    },
    {
      titulo: "CÓMO JUGAR",
      emoji: "🎵",
      contenido: [
        "Se elige una categoría al azar por ronda.",
        "Todos escuchan la canción al mismo tiempo.",
        "Tienes 25 segundos para responder.",
        "Si aciertas, marcas una casilla de ese color.",
        "Puedes elegir qué casilla marcar (estrategia).",
        "Completa una fila, columna o diagonal para ganar.",
        "Si no respondes a tiempo, se toma como error.",
        "¡Presta atención a cada canción!",
      ]
    }
  ];

  function siguiente() {
    if (slide < slides.length - 1) slide++;
    else cerrar();
  }

  function anterior() {
    if (slide > 0) slide--;
  }

  function cerrar() {
    if (noVolver && mostrarNoVolver) {
      try { localStorage.setItem('hitster_tutorial_bingo_visto', 'true'); } catch (e) {}
    }
    dispatch('cerrar');
  }
</script>

{#if visible}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
  <div class="neon-card neon-card-info animate-in">
    <div class="neon-card-corner-tl">
      <span></span><span></span><span></span><span></span>
    </div>

    <div class="neon-card-body">
      <div class="text-4xl mb-2 alerta-icon">{slides[slide].emoji}</div>

      <h2 class="font-neon neon-card-title neon-card-title-info" style="font-size:1.2rem;">
        {slides[slide].titulo}
      </h2>

      <div class="w-full space-y-1 mb-4 min-h-[200px] flex flex-col justify-center items-center text-center">
        {#each slides[slide].contenido as linea}
          <p class="text-slate-200/90 text-xs font-mono leading-relaxed">{linea}</p>
        {/each}
      </div>

      <div class="flex gap-2 mb-4">
        {#each slides as _, i}
          <div class="w-2 h-2 rounded-full transition-all {i === slide ? 'bg-cyan-400 scale-125' : 'bg-white/20'}"></div>
        {/each}
      </div>

      <div class="flex gap-3 w-full">
        {#if slide > 0}
          <button on:click={anterior}
            class="flex-1 bg-white/10 text-slate-300 font-bold py-3 rounded-xl text-sm hover:bg-white/20 transition-all">
            ← Anterior
          </button>
        {/if}
        <button on:click={siguiente}
          class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-indigo-700 transition-all active:scale-95">
          {slide < slides.length - 1 ? 'Siguiente →' : '¡Entendido!'}
        </button>
      </div>

      {#if mostrarNoVolver}
        <label class="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" bind:checked={noVolver} class="accent-cyan-500" />
          <span class="text-slate-400 text-xs">No volver a mostrar</span>
        </label>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  .alerta-icon {
    animation: icon-pulse 1.5s ease-in-out infinite;
  }
  @keyframes icon-pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
</style>
