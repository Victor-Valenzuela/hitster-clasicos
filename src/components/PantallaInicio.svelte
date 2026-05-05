<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let hayPartidaGuardada = false;

  let popup = "";
  let btnState = ""; // "", "lighting-up", "lit", "lighting-off"
  let showSubtitle = false;
  let showBtns = [false, false, false, false];
  let timeouts = [];

  function clearTimeouts() {
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
  }

  function toggle() {
    clearTimeouts();
    if (btnState === "" || btnState === "lighting-off") {
      btnState = "lighting-up";
      timeouts.push(setTimeout(() => (btnState = "lit"), 800));
      timeouts.push(setTimeout(() => (showSubtitle = true), 300));
      timeouts.push(setTimeout(() => ((showBtns[0] = true), (showBtns = showBtns)), 600));
      timeouts.push(setTimeout(() => ((showBtns[1] = true), (showBtns = showBtns)), 800));
      timeouts.push(setTimeout(() => ((showBtns[2] = true), (showBtns = showBtns)), 1000));
      if (hayPartidaGuardada)
        timeouts.push(setTimeout(() => ((showBtns[3] = true), (showBtns = showBtns)), 500));
    } else {
      popup = "";
      showBtns = [false, false, false, false];
      timeouts.push(setTimeout(() => (showSubtitle = false), 150));
      timeouts.push(setTimeout(() => {
        btnState = "lighting-off";
        timeouts.push(setTimeout(() => (btnState = ""), 800));
      }, 300));
    }
  }
</script>

<div class="flex flex-col items-center gap-6 text-center max-w-sm w-full">
  <button
    class="hitster-glow-btn"
    class:lighting-up={btnState === "lighting-up"}
    class:lit={btnState === "lit"}
    class:lighting-off={btnState === "lighting-off"}
    on:click={toggle}
  >
    <span class="hitster-glow-txt"
      >H<span class="hitster-glow-faulty">I</span>TSTER</span
    >
  </button>

  <div
    class="flex items-center justify-center gap-3 chain-hidden"
    class:show={showSubtitle}
  >
    <img
      src="/images/neon1.png"
      alt=""
      class="animate-pulse w-18 h-18 object-contain"
    />
    <p
      class="font-neon neon-text-pink neon-flicker-slow subtitulo-neon uppercase"
    >
      Edición Clásicos
    </p>
    <img
      src="/images/neon2.png"
      alt=""
      class="animate-pulse w-18 h-18 object-contain"
    />
  </div>

  {#if popup === "local"}
    <div class="bg-white/10 rounded-2xl p-5 text-left w-full chain-hidden show">
      <h3 class="text-white font-black text-sm mb-2">👥 Multijugador Local</h3>
      <p class="text-slate-300 text-xs leading-relaxed mb-4">
        Todos juegan en el mismo dispositivo. Ideal para jugar en persona
        pasando el celular o en un computador. Cada jugador ingresa su nombre y
        se turnan para adivinar.
      </p>
      <div class="flex gap-2">
        <button
          on:click={() => {
            popup = "";
            dispatch("modo", "local");
          }}
          class="flex-1 bg-pink-500 text-white text-sm font-black py-3 rounded-xl hover:bg-pink-600 transition-all active:scale-95"
        >
          ¡Vamos!
        </button>
        <button
          on:click={() => (popup = "")}
          class="flex-1 bg-white/10 text-slate-400 text-sm font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
        >
          Volver
        </button>
      </div>
    </div>
  {:else if popup === "online"}
    <div class="bg-white/10 rounded-2xl p-5 text-left w-full chain-hidden show">
      <h3 class="text-white font-black text-sm mb-2">🌐 Sala Online</h3>
      <p class="text-slate-300 text-xs leading-relaxed mb-4">
        Cada jugador juega desde su propio dispositivo. Crea una sala y comparte
        el código o QR para que los demás se unan. ¡Perfecto para jugar a
        distancia!
      </p>
      <div class="flex gap-2">
        <button
          on:click={() => {
            popup = "";
            dispatch("online");
          }}
          class="flex-1 bg-indigo-600 text-white text-sm font-black py-3 rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
        >
          ¡Vamos!
        </button>
        <button
          on:click={() => (popup = "")}
          class="flex-1 bg-white/10 text-slate-400 text-sm font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
        >
          Volver
        </button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-8 items-center" style="width: 75%;">
      {#if hayPartidaGuardada}
        <button
          on:click={() => dispatch("continuar")}
          class="btn-hitster-green w-full text-white text-base font-black py-3 rounded-2xl transition-all active:scale-95 chain-hidden"
          class:show={showBtns[3]}
        >
          ▶️ CONTINUAR PARTIDA
        </button>
      {/if}
      <button
        on:click={() => (popup = "local")}
        class="btn-hitster-pink w-full text-white text-base font-black py-3 rounded-2xl transition-all active:scale-95 chain-hidden"
        class:show={showBtns[0]}
      >
        👥 MULTIJUGADOR LOCAL
      </button>
      <button
        on:click={() => (popup = "online")}
        class="btn-hitster-blue w-full text-white text-base font-black py-3 rounded-2xl transition-all active:scale-95 chain-hidden"
        class:show={showBtns[1]}
      >
        🌐 SALA ONLINE
      </button>
      <button
        on:click={() => dispatch("sugerir")}
        class="btn-glow-border mx-auto w-48 text-white text-sm font-bold py-3 rounded-full chain-hidden"
        class:show={showBtns[2]}
      >
        🎵 Sugerir una canción
      </button>
    </div>
  {/if}
</div>
