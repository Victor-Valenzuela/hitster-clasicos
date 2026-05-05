<script>
  import { createEventDispatcher } from "svelte";
  import { validarTexto } from "../../lib/poderes.js";
  const dispatch = createEventDispatcher();

  export let cancion = {};
  export let modoDificilActivo = false;

  let inputArtista = "";
  let inputCancion = "";
  let enviado = false;

  function enviar() {
    enviado = true;
    const acertoArtista = validarTexto(inputArtista, cancion.artista);
    const acertoCancion = validarTexto(inputCancion, cancion.titulo);
    dispatch("validado", { acertoArtista, acertoCancion });
  }
</script>

<div class="bg-white/10 rounded-2xl p-4 space-y-3">
  <h3 class="text-white font-bold text-sm text-center">
    {modoDificilActivo ? "🔥 Modo difícil — Debes acertar al menos uno" : "¡Bonus! Adivina para ganar ⚡"}
  </h3>

  <div>
    <label class="text-slate-400 text-xs">Artista / Grupo</label>
    <input
      bind:value={inputArtista}
      disabled={enviado}
      placeholder="¿Quién canta?"
      class="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500"
    />
  </div>

  <div>
    <label class="text-slate-400 text-xs">Nombre de la canción</label>
    <input
      bind:value={inputCancion}
      disabled={enviado}
      placeholder="¿Cómo se llama?"
      class="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500"
    />
  </div>

  {#if !enviado}
    <button
      on:click={enviar}
      class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl transition-all text-sm"
    >
      Confirmar
    </button>
  {/if}
</div>
