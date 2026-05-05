<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let carton = []; // flat array of 25 { categoria, marcada }

  // Convert flat array to 5x5 grid for rendering
  $: grid = Array.from({ length: 5 }, (_, f) => carton.slice(f * 5, f * 5 + 5));
  export let categoriaActual = ''; // categoria de la ronda actual
  export let respuestaEnviada = false;
  export let resultado = null; // null, 'correcto', 'incorrecto'
  export let restan = 0;

  const COLORES = {
    'titulo': { bg: 'bg-green-400', border: 'border-green-500', text: 'text-green-900', label: 'Título' },
    'anio': { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-900', label: 'Año exacto' },
    'artista': { bg: 'bg-purple-400', border: 'border-purple-500', text: 'text-purple-900', label: 'Artista' },
    'decada': { bg: 'bg-sky-400', border: 'border-sky-500', text: 'text-sky-900', label: 'Década' },
    'antes_2000': { bg: 'bg-pink-400', border: 'border-pink-500', text: 'text-pink-900', label: '< 2000?' },
  };

  let casillaSeleccionada = null;

  function seleccionarCasilla(fila, col) {
    const idx = fila * 5 + col;
    if (carton[idx].marcada) return;
    if (carton[idx].categoria !== categoriaActual) return;
    if (casillaSeleccionada?.idx === idx) {
      casillaSeleccionada = null;
    } else {
      casillaSeleccionada = { fila, col, idx };
    }
    dispatch('seleccion', casillaSeleccionada);
  }

  // Exponer la casilla seleccionada para que el padre la lea al avanzar
  export function obtenerCasillaSeleccionada() {
    return casillaSeleccionada;
  }

  export function limpiarSeleccion() {
    casillaSeleccionada = null;
  }

  $: if (resultado === 'incorrecto') {
    casillaSeleccionada = null;
  }
</script>

<div class="relative">
  <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl"></div>

  <div class="relative bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-4 border-b-8 border-slate-200">
    <div class="flex justify-between items-center mb-3">
      <span class="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
        Tu cartón
      </span>
      <span class="text-slate-300 font-bold text-xs italic">Restan: {restan}</span>
    </div>

    <!-- Leyenda de categorías -->
    <div class="flex flex-wrap justify-center gap-3 mb-3">
      {#each Object.entries(COLORES) as [key, val]}
        <div class="flex items-center gap-1">
          <div class="w-4 h-4 rounded {val.bg} {categoriaActual === key ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' : ''}"></div>
          <span class="text-slate-500 text-[10px] font-bold">{val.label}</span>
        </div>
      {/each}
    </div>

    <!-- Cartón 5x5 -->
    <div class="grid grid-cols-5 gap-1 mb-3">
      {#each grid as fila, fi}
        {#each fila as casilla, ci}
          {@const idx = fi * 5 + ci}
          {@const color = COLORES[casilla.categoria] || COLORES['titulo']}
          {@const esSeleccionable = !casilla.marcada && casilla.categoria === categoriaActual && resultado !== 'incorrecto'}
          {@const esSeleccionada = casillaSeleccionada?.idx === idx}
          <button
            on:click={() => seleccionarCasilla(fi, ci)}
            style={esSeleccionada ? 'box-shadow: 0 0 0 4px black;' : ''}
            class="aspect-square rounded-lg border-2 flex items-center justify-center transition-all text-lg font-black relative
              {color.bg} {color.border}
              {casilla.marcada
                ? 'opacity-70'
                : esSeleccionada
                  ? 'scale-110 brightness-110'
                  : esSeleccionable
                    ? 'hover:brightness-110 cursor-pointer animate-pulse'
                    : ''}"
          >
            {#if casilla.marcada}
              <div class="casilla-x"></div>
            {:else if esSeleccionada}
              <span class="text-white text-xl">?</span>
            {/if}
          </button>
        {/each}
      {/each}
    </div>

    <!-- Categoría actual -->
    {#if categoriaActual}
      {@const catColor = COLORES[categoriaActual]}
      <div class="text-center mb-2">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-black {catColor.bg} {catColor.text}">
          {catColor.label}
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .casilla-x {
    position: absolute;
    inset: 2px;
    pointer-events: none;
  }
  .casilla-x::before,
  .casilla-x::after {
    content: '';
    position: absolute;
    top: calc(50% - 2px);
    left: 0;
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 2px;
  }
  .casilla-x::before {
    transform: rotate(45deg);
  }
  .casilla-x::after {
    transform: rotate(-45deg);
  }
</style>
