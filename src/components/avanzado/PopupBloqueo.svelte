<script>
  import { createEventDispatcher } from "svelte";
  import { PODERES } from "../../lib/poderes.js";
  const dispatch = createEventDispatcher();

  export let poderRecibido = "";
  export let atacante = "";
  export let poderesDisponibles = 0;

  $: puedoBloquear = poderesDisponibles >= PODERES.bloqueo.coste;
</script>

<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
  <div class="bg-slate-900 rounded-2xl p-5 max-w-xs w-full space-y-3">
    <h3 class="text-white font-bold text-center">
      {PODERES[poderRecibido]?.emoji} ¡{atacante} usó {PODERES[poderRecibido]?.nombre}!
    </h3>
    <p class="text-slate-300 text-xs text-center">
      ¿Quieres bloquearlo? Cuesta {PODERES.bloqueo.coste}⚡
    </p>
    <p class="text-yellow-400 text-sm text-center font-bold">
      Tienes {poderesDisponibles}⚡
    </p>

    <div class="flex gap-2">
      <button
        on:click={() => dispatch("bloquear")}
        disabled={!puedoBloquear}
        class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-white/5 disabled:text-white/30 text-white font-bold py-2 rounded-xl transition-all text-sm"
      >
        🛡️ Bloquear
      </button>
      <button
        on:click={() => dispatch("aceptar")}
        class="flex-1 bg-white/10 text-slate-400 font-bold py-2 rounded-xl text-sm"
      >
        Aceptar
      </button>
    </div>
  </div>
</div>
