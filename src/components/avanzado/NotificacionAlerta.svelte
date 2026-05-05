<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let titulo = "WARNING";
  export let mensaje = "";
  export let visible = false;
  export let duracion = 4000;

  let mostrar = false;

  $: if (visible) {
    mostrar = true;
    if (duracion > 0) {
      setTimeout(() => cerrar(), duracion);
    }
  }

  function cerrar() {
    mostrar = false;
    setTimeout(() => dispatch('cerrar'), 300);
  }
</script>

{#if mostrar}
<div
  class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
  on:click={cerrar}
  role="dialog"
>
  <div class="neon-card neon-card-danger animate-in">
    <div class="neon-card-corner-tl">
      <span></span><span></span><span></span><span></span>
    </div>

    <div class="neon-card-body">
      <div class="neon-icon-danger mb-3 alerta-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 22 22 2 22" stroke-linejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round"/>
          <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
        </svg>
      </div>

      <h2 class="font-neon neon-card-title neon-card-title-danger alerta-flicker">
        {titulo}
      </h2>

      <p class="text-slate-200/90 text-center font-mono text-sm leading-relaxed">
        <slot>{mensaje}</slot>
      </p>

      <p class="text-pink-500/40 text-[10px] font-mono uppercase tracking-widest mt-4">
        Toca para cerrar
      </p>
    </div>
  </div>
</div>
{/if}

<style>
  .alerta-icon {
    animation: alerta-pulse 1.5s ease-in-out infinite;
  }
  @keyframes alerta-pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  .alerta-flicker {
    animation: alerta-text-flicker 3s linear infinite;
  }
  @keyframes alerta-text-flicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55% { opacity: 0.6; }
  }
</style>