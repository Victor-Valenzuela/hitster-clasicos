<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let jugadores = [];
  export let turnoActual = 0;
  export let clickable = false;
  export let esAvanzado = false;
  export let esOriginal = false;
</script>

<div class="flex flex-wrap justify-center gap-2 mb-4 pb-2">
  {#each jugadores as j, i}
    {#if clickable}
      <button
        on:click={() => dispatch('verJugador', j.nombre)}
        class="min-w-[5rem] flex-shrink-0 px-4 py-2 rounded-2xl text-center transition-all relative
        {i === turnoActual ? 'bg-indigo-600 text-white border-2 border-indigo-600' : 'bg-white/90 text-slate-500 border-2 border-slate-200 hover:border-indigo-400'}"
        style="text-shadow: 0 1px 3px rgba(0,0,0,0.4);"
      >
        {#if i === turnoActual}
          <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-lg" style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.9));">👑</span>
        {/if}
        <p class="font-black text-[10px] uppercase tracking-wider truncate max-w-[6rem]">{j.nombre}</p>
        <p class="font-black text-lg leading-none">{j.puntos}</p>
        {#if esAvanzado && j.poderes !== undefined}
          <p class="{i === turnoActual ? 'text-yellow-300' : 'text-slate-500'} text-[10px] font-bold">⚡{j.poderes}</p>
        {/if}
        {#if esOriginal && j.fichas !== undefined}
          <p class="{i === turnoActual ? 'text-amber-300' : 'text-slate-500'} text-[10px] font-bold"><img src="/images/casino.png" alt="ficha" class="inline w-3 h-3" style="vertical-align: middle; margin-top: -2px;" />{j.fichas}</p>
        {/if}
      </button>
    {:else}
      <div class="min-w-[5rem] flex-shrink-0 px-4 py-2 rounded-2xl text-center transition-all relative
        {i === turnoActual ? 'bg-indigo-600 text-white border-2 border-indigo-600' : 'bg-white/90 text-slate-500 border-2 border-slate-200'}"
        style="text-shadow: 0 1px 3px rgba(0,0,0,0.4);"
      >
        {#if i === turnoActual}
          <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-lg" style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.9));">👑</span>
        {/if}
        <p class="font-black text-[10px] uppercase tracking-wider truncate max-w-[6rem]">{j.nombre}</p>
        <p class="font-black text-lg leading-none">{j.puntos}</p>
        {#if esAvanzado && j.poderes !== undefined}
          <p class="{i === turnoActual ? 'text-yellow-300' : 'text-slate-500'} text-[10px] font-bold">⚡{j.poderes}</p>
        {/if}
        {#if esOriginal && j.fichas !== undefined}
          <p class="{i === turnoActual ? 'text-amber-300' : 'text-slate-500'} text-[10px] font-bold"><img src="/images/casino.png" alt="ficha" class="inline w-3 h-3" style="vertical-align: middle; margin-top: -2px;" />{j.fichas}</p>
        {/if}
      </div>
    {/if}
  {/each}
</div>
