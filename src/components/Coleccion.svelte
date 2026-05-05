<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let linea = [];
  export let cancionActual = null;
  export let revelada = false;
  export let indiceSeleccionado = null;
  export let resultado = null;
  export let nombreJugador = '';
  export let esMultijugador = false;
  export let compacto = false;
  export let viendoOtro = false;

  let cardExpandida = null;

  function toggleCard(i) {
    cardExpandida = cardExpandida === i ? null : i;
  }
</script>

<div class="w-full">
  <h3 class="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">
    {#if viendoOtro}
      Estás viendo la colección de <span class="text-white font-black text-xs" style="text-shadow: 0 0 10px rgba(129,140,248,0.8), 0 0 4px rgba(129,140,248,0.6);">{nombreJugador}</span>
    {:else}
      Tu Colección ({linea.length})
    {/if}
  </h3>
  <div class="{compacto ? 'grid-coleccion-compacto' : 'grid-coleccion'}">
    {#each { length: linea.length + 1 } as _, i}
      {@const mismoAnio = i > 0 && i < linea.length && linea[i-1].year === linea[i].year}
      {#if !revelada && cancionActual && !mismoAnio}
        <button
          on:click={() => dispatch('seleccionar', i)}
          class="card-slot border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95
          {indiceSeleccionado === i ? 'border-indigo-400 bg-indigo-100/90 scale-105 shadow-lg shadow-indigo-500/20' : 'border-white/30 bg-white/5 hover:border-indigo-400/60'}"
        >
          {#if indiceSeleccionado === i}
            <span class="text-4xl">❓</span>
            <span class="text-sm font-black text-indigo-600 mt-1">¿AQUÍ?</span>
          {:else}
            <span class="text-white/40 text-2xl">+</span>
          {/if}
        </button>
      {:else if revelada && indiceSeleccionado === i}
        <div class="card-slot rounded-2xl flex flex-col items-center justify-center border-4 animate-in
          {resultado === 'correcto' ? 'border-emerald-400 bg-emerald-50/90' : 'border-red-400 bg-red-50/90'} shadow-xl">
          {#if cancionActual.portada}
            <img src={cancionActual.portada} alt="cover" class="card-img rounded-lg mb-1" />
          {/if}
          <span class="text-lg">{resultado === 'correcto' ? '✅' : '❌'}</span>
          <span class="font-black text-xs text-slate-800">{cancionActual.year}</span>
        </div>
      {/if}
      {#if i < linea.length}
        <button
          on:click={() => toggleCard(i)}
          on:mouseenter={() => cardExpandida = i}
          on:mouseleave={() => cardExpandida = null}
          class="card-slot bg-white/90 backdrop-blur-md rounded-2xl shadow-md border-b-4 border-slate-200 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-transform duration-200
            {cardExpandida === i ? 'card-expandida z-50 shadow-2xl ring-2 ring-indigo-400' : 'hover:scale-105'}"
        >
          <p class="card-artista font-bold text-slate-500 uppercase leading-tight {cardExpandida === i ? 'whitespace-normal text-[8px]' : 'truncate'} w-full">{linea[i].artista}</p>
          {#if cardExpandida !== i}
            {#if linea[i].portada}
              <img src={linea[i].portada} alt="cover" class="card-img card-img-hide rounded-lg mb-1 mt-1" />
            {:else}
              <div class="card-img card-img-hide rounded-lg mb-1 mt-1 bg-slate-200 flex items-center justify-center">
                <span class="text-2xl">💿</span>
              </div>
            {/if}
          {/if}
          <span class="{cardExpandida === i ? 'text-sm my-1' : 'card-year'} text-indigo-600 font-black leading-none">{linea[i].year}</span>
          <p class="card-titulo font-bold text-slate-500 uppercase leading-tight {cardExpandida === i ? 'whitespace-normal text-[8px]' : 'truncate'} w-full">{linea[i].titulo}</p>
        </button>
      {/if}
    {/each}
  </div>
</div>
