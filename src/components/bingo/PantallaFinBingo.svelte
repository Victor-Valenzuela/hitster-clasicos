<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import confetti from 'canvas-confetti';
  const dispatch = createEventDispatcher();

  export let jugadores = [];

  function verificarLinea(carton) {
    if (!carton || carton.length !== 25) return false;
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

  $: ganador = jugadores.find(j => j.ganadorBingo) || jugadores.find(j => verificarLinea(j.carton));
  $: otros = jugadores.filter(j => j !== ganador);

  onMount(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { x: 0.2, y: 0.5 } }), 300);
    setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { x: 0.8, y: 0.5 } }), 600);
  });
</script>

<div class="bg-white/90 backdrop-blur-md p-10 rounded-[40px] shadow-2xl text-center border-b-8 border-indigo-100 max-w-sm w-full">
  <div class="text-6xl mb-4">🪩</div>
  <h2 class="text-3xl font-black text-slate-800 mb-6">¡BINGO!</h2>
  <div class="flex flex-col gap-3 mb-8">
    {#if ganador}
      <div class="flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-600 text-white">
        <span class="font-black">👑 {ganador.nombre}</span>
        <span class="font-black text-lg">🪩 Ganador</span>
      </div>
    {/if}
    {#each otros as j, i}
      <div class="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-100 text-slate-600">
        <span class="font-black">#{i + 2} {j.nombre}</span>
      </div>
    {/each}
  </div>
  <div class="flex flex-col gap-2">
    <button on:click={() => dispatch('reiniciar')} class="w-full bg-indigo-600 text-white text-lg font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
      VOLVER AL INICIO
    </button>
    <button on:click={() => dispatch('sugerir')} class="btn-glow-border mx-auto w-48 text-white text-sm font-bold py-3 rounded-full">
      🎵 Sugerir una canción
    </button>
  </div>
</div>
