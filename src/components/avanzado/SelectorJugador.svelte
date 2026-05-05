<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let jugadores = [];
  export let jugadorActual = "";
  export let titulo = "Elige un jugador";

  $: otros = jugadores.filter((j) => j.nombre !== jugadorActual);
</script>

<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
  <div class="bg-slate-900 rounded-2xl p-5 max-w-xs w-full space-y-3">
    <h3 class="text-white font-bold text-center">{titulo}</h3>

    {#each otros as jugador}
      <button
        on:click={() => dispatch("seleccionar", jugador.nombre)}
        class="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all text-sm"
      >
        {jugador.nombre} — {jugador.puntos} pts
      </button>
    {/each}

    <button
      on:click={() => dispatch("cancelar")}
      class="w-full bg-white/5 text-slate-400 font-bold py-2 rounded-xl text-sm"
    >
      Cancelar
    </button>
  </div>
</div>
