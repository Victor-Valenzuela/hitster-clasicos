<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let coleccionPropia = [];
  export let coleccionObjetivo = [];
  export let nombreObjetivo = "";

  let cartaPropia = null;
  let cartaObjetivo = null;

  function confirmar() {
    if (cartaPropia !== null && cartaObjetivo !== null) {
      dispatch("intercambiar", { cartaPropia, cartaObjetivo });
    }
  }
</script>

<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
  <div class="bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-4 my-4">
    <h3 class="text-white font-bold text-center text-lg">🔀 Intercambio</h3>

    <div>
      <p class="text-slate-400 text-xs font-bold mb-2">Tu carta:</p>
      <div class="grid grid-cols-5 gap-2">
        {#each coleccionPropia as carta, i}
          <button
            on:click={() => (cartaPropia = i)}
            class="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-h-[5rem]
              {cartaPropia === i
                ? 'bg-purple-600 scale-105 shadow-lg shadow-purple-500/30'
                : 'bg-white/90 hover:bg-white'}"
          >
            <span class="font-black text-lg leading-none {cartaPropia === i ? 'text-white' : 'text-indigo-600'}">{carta.year}</span>
            <span class="text-[8px] leading-tight mt-1 text-center truncate w-full {cartaPropia === i ? 'text-white/80' : 'text-slate-500'}">{carta.titulo}</span>
          </button>
        {/each}
      </div>
    </div>

    <div>
      <p class="text-slate-400 text-xs font-bold mb-2">Carta de {nombreObjetivo}:</p>
      <div class="grid grid-cols-5 gap-2">
        {#each coleccionObjetivo as carta, i}
          <button
            on:click={() => (cartaObjetivo = i)}
            class="flex flex-col items-center justify-center p-2 rounded-xl transition-all min-h-[5rem]
              {cartaObjetivo === i
                ? 'bg-pink-600 scale-105 shadow-lg shadow-pink-500/30'
                : 'bg-white/90 hover:bg-white'}"
          >
            <span class="font-black text-lg leading-none {cartaObjetivo === i ? 'text-white' : 'text-indigo-600'}">{carta.year}</span>
            <span class="text-[8px] leading-tight mt-1 text-center truncate w-full {cartaObjetivo === i ? 'text-white/80' : 'text-slate-500'}">{carta.titulo}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="flex gap-2">
      <button
        on:click={confirmar}
        disabled={cartaPropia === null || cartaObjetivo === null}
        class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-white/5 disabled:text-white/30 text-white font-bold py-2 rounded-xl transition-all text-sm"
      >
        Confirmar
      </button>
      <button
        on:click={() => dispatch("cancelar")}
        class="flex-1 bg-white/5 text-slate-400 font-bold py-2 rounded-xl text-sm hover:bg-white/10"
      >
        Cancelar
      </button>
    </div>
  </div>
</div>
