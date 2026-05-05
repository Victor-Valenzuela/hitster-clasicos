<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let todosGeneros = [];

  let numJugadores = 1;
  let nombresInput = [''];
  let error = '';
  let generosSeleccionados = [];
  let inicializado = false;
  let mostrarGeneros = false;

  $: if (todosGeneros.length > 0 && !inicializado) {
    generosSeleccionados = [...todosGeneros];
    inicializado = true;
  }

  function toggleGenero(g) {
    if (generosSeleccionados.includes(g)) {
      generosSeleccionados = generosSeleccionados.filter(x => x !== g);
    } else {
      generosSeleccionados = [...generosSeleccionados, g];
    }
    error = '';
  }

  function toggleTodos() {
    if (generosSeleccionados.length === todosGeneros.length) {
      generosSeleccionados = [];
    } else {
      generosSeleccionados = [...todosGeneros];
    }
  }

  function actualizarNum(delta) {
    const nuevo = numJugadores + delta;
    if (nuevo < 1 || nuevo > 8) return;
    numJugadores = nuevo;
    nombresInput = Array.from({ length: numJugadores }, (_, i) => nombresInput[i] || '');
    error = '';
  }

  function intentarIniciar() {
    const nombres = nombresInput.map(n => n.trim());

    if (nombres.some(n => n === '')) {
      error = 'Todos los jugadores necesitan un nombre';
      return;
    }
    const unicos = new Set(nombres.map(n => n.toLowerCase()));
    if (unicos.size !== nombres.length) {
      error = 'No puede haber nombres repetidos';
      return;
    }
    if (generosSeleccionados.length === 0) {
      error = 'Selecciona al menos una categoría';
      return;
    }

    error = '';
    dispatch('iniciar', { nombres, generos: generosSeleccionados });
  }
</script>

<div class="glass p-10 rounded-[40px] max-w-sm w-full transition-shadow duration-500"
  style="box-shadow: 0 0 40px rgba(236, 72, 153, 0.45), 0 0 80px rgba(236, 72, 153, 0.2);"
>
  <h2 class="text-2xl font-black text-white text-center mb-8"><span style="filter: drop-shadow(0 0 3px white); display: inline-block; transform: translateY(-2px);">👥</span> Multijugador Local</h2>

  <label class="text-white font-black text-xs uppercase tracking-wider block text-center">Jugadores</label>
  <div class="flex items-center gap-3 mt-2 mb-6 justify-center">
    <button on:click={() => actualizarNum(-1)}
      class="w-10 h-10 rounded-full bg-white/10 text-white font-black text-xl flex items-center justify-center hover:bg-white/20">−</button>
    <span class="text-3xl font-black text-white">{numJugadores}</span>
    <button on:click={() => actualizarNum(1)}
      class="w-10 h-10 rounded-full bg-white/10 text-white font-black text-xl flex items-center justify-center hover:bg-white/20">+</button>
  </div>

  <div class="flex flex-col gap-2 mb-6">
    {#each nombresInput as _, i}
      <input
        bind:value={nombresInput[i]}
        placeholder="Jugador {i + 1}"
        on:input={() => error = ''}
        class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 focus:outline-none text-sm font-bold text-white placeholder:text-slate-500"
      />
    {/each}
  </div>

  <div class="mb-2 flex items-center justify-between">
    <label class="text-white font-black text-xs uppercase tracking-wider">Categorías</label>
    <button on:click={() => mostrarGeneros = true} class="text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300">
      Elección ({generosSeleccionados.length}/{todosGeneros.length})
    </button>
  </div>
  <button
    on:click={() => mostrarGeneros = true}
    class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm font-bold text-slate-300 text-left hover:bg-white/15 transition-all mb-2"
  >
    {generosSeleccionados.length === todosGeneros.length
      ? 'Todas las categorías'
      : 'Selección personalizada'}
  </button>

  {#if error}
    <p class="text-red-400 text-xs font-bold text-center mb-4 mt-2">{error}</p>
  {:else}
    <div class="mb-6"></div>
  {/if}

  <div class="flex flex-col gap-2">
    <button on:click={intentarIniciar} class="w-full bg-pink-500 text-white text-lg font-black py-4 rounded-2xl shadow-xl hover:bg-pink-600 transition-all active:scale-95">
      ¡A JUGAR!
    </button>
    <button on:click={() => dispatch('volver')} class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300">
      ← Volver
    </button>
  </div>
</div>

{#if mostrarGeneros}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 rounded-[40px]">
    <div class="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-black text-base uppercase tracking-wider">Categorías</h3>
        <button on:click={toggleTodos} class="text-indigo-400 text-xs font-bold uppercase tracking-wider hover:text-indigo-300">
          {generosSeleccionados.length === todosGeneros.length ? 'Quitar todos' : 'Todos'}
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-6 justify-center">
        {#each todosGeneros as g}
          <button
            on:click={() => toggleGenero(g)}
            class="px-3 py-1 rounded-full text-xs font-bold transition-all
            {generosSeleccionados.includes(g) ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
          >{g}</button>
        {/each}
      </div>
      <button
        on:click={() => mostrarGeneros = false}
        class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-indigo-700 transition-all active:scale-95"
      >
        Listo
      </button>
    </div>
  </div>
{/if}
