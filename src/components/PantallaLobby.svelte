<script>
  import { createEventDispatcher, onMount } from "svelte";
  import QRCode from "qrcode";
  const dispatch = createEventDispatcher();

  export let codigo = "";
  export let jugadores = [];
  export let esHost = false;
  export let todosGeneros = [];
  export let modo = "clasico";

  let qrDataUrl = "";
  let generosSeleccionados = [];
  let inicializado = false;
  let mostrarGeneros = false;

  $: if (todosGeneros.length > 0 && !inicializado) {
    generosSeleccionados = [...todosGeneros];
    inicializado = true;
  }

  $: urlSala =
    typeof window !== "undefined"
      ? `${window.location.origin}?sala=${codigo}`
      : "";

  $: if (urlSala) {
    QRCode.toDataURL(urlSala, {
      width: 200,
      margin: 1,
      color: { dark: "#6366f1", light: "#00000000" },
    })
      .then((url) => (qrDataUrl = url))
      .catch(() => {});
  }

  function toggleGenero(g) {
    if (generosSeleccionados.includes(g)) {
      generosSeleccionados = generosSeleccionados.filter((x) => x !== g);
    } else {
      generosSeleccionados = [...generosSeleccionados, g];
    }
  }

  function toggleTodos() {
    generosSeleccionados =
      generosSeleccionados.length === todosGeneros.length
        ? []
        : [...todosGeneros];
  }

  function iniciar() {
    if (jugadores.length < 2) return;
    if (generosSeleccionados.length === 0) return;
    dispatch("iniciar", { generos: generosSeleccionados, modo });
  }
</script>

<div class="glass p-4 rounded-[40px] max-w-sm w-full text-center transition-shadow duration-500"
  style="box-shadow: 0 0 40px {modo === 'clasico' ? 'rgba(16, 185, 129, 0.45)' : modo === 'original' ? 'rgba(245, 158, 11, 0.45)' : modo === 'bingo' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(147, 51, 234, 0.45)'}, 0 0 80px {modo === 'clasico' ? 'rgba(16, 185, 129, 0.2)' : modo === 'original' ? 'rgba(245, 158, 11, 0.2)' : modo === 'bingo' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(147, 51, 234, 0.2)'};"
>
  <p class="text-white font-black tracking-[0.3em] mb- lobby-codigo">
    {codigo}
  </p>

  {#if qrDataUrl}
    <img src={qrDataUrl} alt="QR" class="mx-auto mb-3 lobby-qr" />
  {/if}

  <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
    {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""} conectado{jugadores.length !==
    1
      ? "s"
      : ""}
  </p>

  <div class="flex flex-wrap justify-center gap-2 mb-6">
    {#each jugadores as j, i}
      <div
        class="px-4 py-2 rounded-2xl text-center {i === 0
          ? 'bg-indigo-600 text-white'
          : 'bg-white/10 text-slate-300'}"
      >
        <p class="font-black text-sm">{i === 0 ? "👑" : ""} {j.nombre}</p>
      </div>
    {/each}
  </div>

  {#if esHost}
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-white font-black text-xs uppercase tracking-wider">Categorías</label>
        <button
          on:click={() => mostrarGeneros = true}
          class="text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-300"
        >
          Elección ({generosSeleccionados.length}/{todosGeneros.length})
        </button>
      </div>
      <button
        on:click={() => mostrarGeneros = true}
        class="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-slate-300 text-left hover:bg-white/15 transition-all"
      >
        {generosSeleccionados.length === todosGeneros.length
          ? 'Todas las categorías'
          : 'Selección personalizada'}
      </button>
    </div>

    <div class="mb-4">
      <label
        class="text-white font-black text-xs uppercase tracking-wider block mb-2"
        >Modo de juego</label
      >
      <div class="grid grid-cols-2 gap-2">
        <button
          on:click={() => (modo = "clasico")}
          class="px-3 py-2 rounded-xl text-sm font-bold transition-all
            {modo === 'clasico'
            ? 'bg-emerald-600 text-white'
            : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
        >
          <span style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">🎵</span> Clásico
        </button>
        <button
          on:click={() => (modo = "original")}
          class="px-3 py-2 rounded-xl text-sm font-bold transition-all
            {modo === 'original'
            ? 'bg-amber-600 text-white'
            : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
        >
          <span style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">🎯</span> Original
        </button>
        <button
          on:click={() => (modo = "avanzado")}
          class="px-3 py-2 rounded-xl text-sm font-bold transition-all
            {modo === 'avanzado'
            ? 'bg-purple-600 text-white'
            : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
        >
          <span style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">⚡</span> Avanzado
        </button>
        <button
          on:click={() => (modo = "bingo")}
          class="px-3 py-2 rounded-xl text-sm font-bold transition-all
            {modo === 'bingo'
            ? 'bg-cyan-600 text-white'
            : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
        >
          <span style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">🪩</span> Bingo
        </button>
      </div>
      {#if modo === "avanzado"}
        <p class="text-slate-300 text-xs mt-2 leading-relaxed">
          Adivina artista y canción para ganar ⚡ poderes. Úsalos para
          cambiar cartas, desafiar rivales y más.
        </p>
      {:else if modo === "original"}
        <p class="text-slate-300 text-xs mt-2 leading-relaxed">
          Reglas oficiales de HITSTER. Gasta fichas para saltar, activar
          HITSTER o canjear por cartas.
        </p>
      {:else if modo === "bingo"}
        <p class="text-slate-300 text-xs mt-2 leading-relaxed">
          Todos juegan a la vez. Adivina década, artista, año o antes/después
          del 2000. Completa una fila o columna para ganar.
        </p>
      {:else}
        <p class="text-slate-300 text-xs mt-2 leading-relaxed">
          Coloca las canciones en orden cronológico. Adivina el año correcto
          para sumar puntos.
        </p>
      {/if}
    </div>

    <button
      on:click={iniciar}
      disabled={jugadores.length < 2 || generosSeleccionados.length === 0}
      class="w-64 bg-emerald-500 text-white text-lg font-black py-2 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
    >
      🚀 INICIAR ({jugadores.length}
      {jugadores.length !== 1 ? "jugadores" : "jugador"})
    </button>
  {:else}
    <div
      class="w-64 bg-white/5 text-slate-400 text-sm font-bold py-4 rounded-2xl border border-white/10"
    >
      ⏳ Esperando al host.
    </div>
  {/if}

  <button
    on:click={() => dispatch("salir")}
    class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300 mt-4"
  >
    ← Salir de la sala
  </button>
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

<style>
  .lobby-codigo { font-size: 1.5rem; }
  .lobby-qr { width: 7rem; height: 7rem; }

  @media (min-width: 400px) {
    .lobby-codigo { font-size: 1.875rem; }
    .lobby-qr { width: 10rem; height: 10rem; }
  }
</style>
