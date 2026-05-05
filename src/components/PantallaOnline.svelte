<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let codigoInicial = '';

  let modo = codigoInicial ? 'unirse' : 'elegir';
  let nombre = '';
  let codigo = codigoInicial;
  let error = '';

  function irCrear() { modo = 'crear'; error = ''; }
  function irUnirse() { modo = 'unirse'; error = ''; }

  function confirmarCrear() {
    if (!nombre.trim()) { error = 'Ingresa tu nombre'; return; }
    error = '';
    dispatch('crear', nombre.trim());
  }

  function confirmarUnirse() {
    if (!nombre.trim()) { error = 'Ingresa tu nombre'; return; }
    if (!codigo.trim()) { error = 'Ingresa el código de sala'; return; }
    error = '';
    dispatch('unirse', { nombre: nombre.trim(), codigo: codigo.trim().toUpperCase() });
  }

  export function mostrarError(msg) { error = msg; }
</script>

<div class="glass p-10 rounded-[40px] shadow-2xl max-w-sm w-full">
  {#if modo === 'elegir'}
    <h2 class="text-xl font-black text-white text-center mb-8">🌐 Sala Online</h2>
    <div class="flex flex-col gap-3">
      <button on:click={irCrear} class="w-full bg-indigo-600 text-white text-sm font-black py-5 px-6 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
        🎮 CREAR SALA
      </button>
      <button on:click={irUnirse} class="w-full bg-pink-500 text-white text-sm font-black py-5 px-6 rounded-2xl shadow-xl hover:bg-pink-600 transition-all active:scale-95">
        🔗 UNIRSE CON CÓDIGO
      </button>
      <button on:click={() => dispatch('volver')} class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300">
        ← Volver
      </button>
    </div>

  {:else if modo === 'crear'}
    <h2 class="text-2xl font-black text-white text-center mb-8">🎮 Crear Sala</h2>
    <input
      bind:value={nombre}
      placeholder="Tu nombre"
      class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 focus:outline-none text-sm font-bold text-white placeholder:text-slate-500 mb-4"
    />
    {#if error}
      <p class="text-red-400 text-xs font-bold text-center mb-4">{error}</p>
    {/if}
    <div class="flex flex-col gap-2">
      <button on:click={confirmarCrear} class="w-full bg-indigo-600 text-white text-lg font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
        CREAR SALA
      </button>
      <button on:click={() => { modo = 'elegir'; error = ''; }} class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300">
        ← Volver
      </button>
    </div>

  {:else}
    <h2 class="text-2xl font-black text-white text-center mb-8">🔗 Unirse a Sala</h2>
    <div class="flex flex-col gap-3 mb-4">
      <input
        bind:value={nombre}
        placeholder="Tu nombre"
        class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 focus:outline-none text-sm font-bold text-white placeholder:text-slate-500"
      />
      <input
        bind:value={codigo}
        placeholder="Código de sala"
        class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 focus:outline-none text-sm font-bold text-white placeholder:text-slate-500 uppercase tracking-widest text-center text-lg"
      />
    </div>
    {#if error}
      <p class="text-red-400 text-xs font-bold text-center mb-4">{error}</p>
    {/if}
    <div class="flex flex-col gap-2">
      <button on:click={confirmarUnirse} class="w-full bg-pink-500 text-white text-lg font-black py-4 rounded-2xl shadow-xl hover:bg-pink-600 transition-all active:scale-95">
        UNIRSE
      </button>
      <button on:click={() => { modo = 'elegir'; error = ''; }} class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300">
        ← Volver
      </button>
    </div>
  {/if}
</div>
