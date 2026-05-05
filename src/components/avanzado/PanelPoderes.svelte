<script>
  import { PODERES, puedeUsarPoder } from "../../lib/poderes.js";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let jugador = {};
  export let esMiTurno = false;
  export let fase = "";
  export let poderesUsados = [];

  $: poderesDisponibles = Object.entries(PODERES).filter(
    ([key]) => key !== "bloqueo"
  );

  function puedeUsar(key) {
    return puedeUsarPoder(jugador, key) && !poderesUsados.includes(key);
  }
</script>

<div class="flex items-center gap-3 flex-wrap justify-center">
  <span class="text-yellow-400 font-bold text-xl">⚡ {jugador.poderes || 0}</span>

  {#each poderesDisponibles as [key, poder]}
    <button
      disabled={!puedeUsar(key)}
      on:click={() => dispatch("poder", key)}
      class="px-4 py-2 rounded-lg text-sm font-bold transition-all
        {poderesUsados.includes(key)
          ? 'bg-red-900/40 text-red-400/60 cursor-not-allowed line-through'
          : puedeUsar(key)
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white/5 text-white/30 cursor-not-allowed'}"
      title="{poder.nombre} ({poder.coste}⚡){poderesUsados.includes(key) ? ' - Ya usado' : ''}"
    >
      {poder.emoji} {poder.coste}
    </button>
  {/each}
</div>
