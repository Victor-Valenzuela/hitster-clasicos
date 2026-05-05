<script>
  import { createEventDispatcher } from 'svelte';
  import { enviarSugerencia } from '../lib/firestore.js';
  import { cargarCanciones } from '../lib/gameLogic.js';
  const dispatch = createEventDispatcher();

  const DEEZER_PROXY = 'https://corsproxy.io/?';
  const GENEROS = ['Rock/Pop', 'Balada', 'Cumbia', 'Tropical', 'Reggaeton', 'Clásicos Latinos', 'Ranchera', 'Trova/Cantautor', 'Clasicos/Ingles', 'Rock/Pop Ingles'];

  let busqueda = '';
  let resultados = [];
  let buscando = false;
  let seleccionada = null;
  let generoElegido = '';
  let enviando = false;
  let mensaje = '';
  let timerBusqueda;
  let buscandoAnio = false;
  let fuenteAnio = '';

  function onInput() {
    mensaje = '';
    seleccionada = null;
    clearTimeout(timerBusqueda);
    if (busqueda.trim().length < 3) { resultados = []; return; }
    timerBusqueda = setTimeout(buscar, 500);
  }

  // Búsqueda principal: iTunes, fallback Deezer
  async function buscar() {
    buscando = true;
    resultados = await buscarItunes();
    if (resultados.length === 0) {
      resultados = await buscarDeezer();
    }
    buscando = false;
  }

  async function buscarItunes() {
    try {
      const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(busqueda) + '&media=music&limit=6';
      const res = await fetch(url);
      const text = await res.text();
      if (text.startsWith('<') || text.startsWith('Rate')) return [];
      const data = JSON.parse(text);
      return (data.results || []).map(r => ({
        titulo: r.trackName,
        artista: r.artistName,
        year: new Date(r.releaseDate).getFullYear(),
        portada: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '400x400') : '',
        fuente: 'itunes'
      }));
    } catch (e) { return []; }
  }

  async function buscarDeezer() {
    try {
      const url = DEEZER_PROXY + encodeURIComponent('https://api.deezer.com/search?q=' + encodeURIComponent(busqueda) + '&limit=6');
      const res = await fetch(url);
      const data = await res.json();
      return (data.data || []).map(r => ({
        titulo: r.title,
        artista: r.artist ? r.artist.name : '',
        year: 0,
        portada: r.album ? r.album.cover_big : '',
        fuente: 'deezer'
      }));
    } catch (e) { return []; }
  }

  function seleccionar(r) {
    seleccionada = r;
    generoElegido = GENEROS[0];
    resultados = [];
    busqueda = '';
    fuenteAnio = '';

    if (r.year && r.year > 0) {
      fuenteAnio = r.fuente;
    } else {
      buscarAnioFallback(r.titulo, r.artista);
    }
  }

  // Fallback: MusicBrainz + Deezer album en paralelo, tomar el más antiguo
  async function buscarAnioFallback(titulo, artista) {
    buscandoAnio = true;
    try {
      const [anioMB, anioDZ] = await Promise.all([
        buscarAnioMusicBrainz(titulo, artista),
        buscarAnioDeezer(titulo, artista)
      ]);
      const anios = [anioMB, anioDZ].filter(a => a && a > 1900 && a < 2100);
      if (anios.length > 0 && seleccionada) {
        seleccionada.year = Math.min(...anios);
        fuenteAnio = anioMB ? 'musicbrainz' : 'deezer';
        seleccionada = seleccionada;
      }
    } catch (e) {
      console.warn('Error buscando año:', e);
    }
    buscandoAnio = false;
  }

  async function buscarAnioMusicBrainz(titulo, artista) {
    try {
      const q = encodeURIComponent('recording:"' + titulo + '" AND artist:"' + artista + '"');
      const url = 'https://musicbrainz.org/ws/2/recording?query=' + q + '&limit=5&fmt=json';
      const res = await fetch(url, { headers: { 'User-Agent': 'HitsterGame/1.0' } });
      const data = await res.json();
      if (data.recordings) {
        const fechas = [];
        for (const rec of data.recordings) {
          if (rec.releases) {
            for (const rel of rec.releases) {
              if (rel.date) {
                const a = parseInt(rel.date.substring(0, 4));
                if (a > 1900) fechas.push(a);
              }
            }
          }
        }
        if (fechas.length > 0) return Math.min(...fechas);
      }
    } catch (e) {}
    return null;
  }

  async function buscarAnioDeezer(titulo, artista) {
    try {
      const q = encodeURIComponent(titulo + ' ' + artista);
      const url = DEEZER_PROXY + encodeURIComponent('https://api.deezer.com/search?q=' + q + '&limit=1');
      const res = await fetch(url);
      const data = await res.json();
      if (data.data && data.data[0]) {
        const albumUrl = DEEZER_PROXY + encodeURIComponent('https://api.deezer.com/album/' + data.data[0].album.id);
        const res2 = await fetch(albumUrl);
        const album = await res2.json();
        if (album.release_date) {
          return parseInt(album.release_date.substring(0, 4));
        }
      }
    } catch (e) {}
    return null;
  }

  async function enviar() {
    if (!seleccionada) { mensaje = 'Busca y selecciona una canción'; return; }
    if (!generoElegido) { mensaje = 'Selecciona una categoría'; return; }
    if (!seleccionada.year || seleccionada.year === 0) {
      mensaje = '⚠️ No se pudo obtener el año. No se puede agregar sin año.';
      return;
    }

    enviando = true;
    mensaje = '';

    try {
      const existentes = await cargarCanciones();
      const duplicada = existentes.some(c =>
        c.titulo.toLowerCase() === seleccionada.titulo.toLowerCase() &&
        c.artista.toLowerCase() === seleccionada.artista.toLowerCase()
      );

      if (duplicada) {
        mensaje = '⚠️ Esta canción ya existe en el juego';
        enviando = false;
        return;
      }

      await enviarSugerencia({
        titulo: seleccionada.titulo,
        artista: seleccionada.artista,
        year: seleccionada.year,
        genero: generoElegido,
        portada: seleccionada.portada || null
      });
      mensaje = '✅ ¡Sugerencia enviada!';
      seleccionada = null;
      generoElegido = '';
      setTimeout(() => dispatch('cerrar'), 1500);
    } catch (e) {
      mensaje = '❌ Error al enviar';
    }
    enviando = false;
  }
</script>

<div class="glass p-8 rounded-[40px] shadow-2xl max-w-sm w-full">
  <h2 class="text-xl font-black text-white text-center mb-6">🎵 Sugerir Canción</h2>

  {#if !seleccionada}
    <input
      bind:value={busqueda}
      on:input={onInput}
      placeholder="Buscar canción o artista..."
      class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-400 focus:outline-none text-sm font-bold text-white placeholder:text-slate-500 mb-3"
    />

    {#if buscando}
      <div class="flex justify-center py-4">
        <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    {:else if resultados.length > 0}
      <div class="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
        {#each resultados as r}
          <button
            on:click={() => seleccionar(r)}
            class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 transition-all text-left"
          >
            {#if r.portada}
              <img src={r.portada} alt="" class="w-10 h-10 rounded-lg" />
            {:else}
              <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><span class="text-lg">💿</span></div>
            {/if}
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-black leading-tight">{r.titulo}</p>
              <p class="text-slate-400 text-xs">{r.artista}{#if r.year} · {r.year}{/if}</p>
            </div>
          </button>
        {/each}
      </div>
    {:else if busqueda.trim().length >= 3}
      <p class="text-slate-500 text-xs text-center mb-4">No se encontraron resultados</p>
    {/if}
  {:else}
    <div class="flex items-center gap-3 p-4 rounded-xl bg-white/10 mb-4">
      {#if seleccionada.portada}
        <img src={seleccionada.portada} alt="" class="w-12 h-12 rounded-lg" />
      {/if}
      <div class="flex-1">
        <p class="text-white text-sm font-black">{seleccionada.titulo}</p>
        <p class="text-slate-400 text-xs">
          {seleccionada.artista}
          {#if seleccionada.year && seleccionada.year > 0}
            · {seleccionada.year}
          {:else if buscandoAnio}
            · <span class="text-indigo-400">buscando año...</span>
          {:else}
            · <span class="text-red-400">año no encontrado</span>
          {/if}
        </p>
      </div>
      <button on:click={() => seleccionada = null} class="text-slate-500 hover:text-white text-lg">✕</button>
    </div>

    <label class="text-white font-black text-xs uppercase tracking-wider mb-2 block">Categoría</label>
    <div class="flex flex-wrap gap-2 mb-4">
      {#each GENEROS as g}
        <button
          on:click={() => generoElegido = g}
          class="px-3 py-1 rounded-full text-xs font-bold transition-all
          {generoElegido === g ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}"
        >{g}</button>
      {/each}
    </div>
  {/if}

  {#if mensaje}
    <p class="text-xs font-bold text-center mb-3 {mensaje.startsWith('✅') ? 'text-emerald-400' : mensaje.startsWith('⚠️') ? 'text-yellow-400' : 'text-red-400'}">{mensaje}</p>
  {/if}

  <div class="flex flex-col gap-2">
    {#if seleccionada}
      <button on:click={enviar} disabled={enviando || buscandoAnio || !seleccionada.year}
        class="w-full bg-indigo-600 text-white text-lg font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
        {enviando ? 'Verificando...' : buscandoAnio ? 'Obteniendo año...' : !seleccionada.year ? 'SIN AÑO — NO SE PUEDE AGREGAR' : 'ENVIAR SUGERENCIA'}
      </button>
    {/if}
    <button on:click={() => dispatch('cerrar')} class="text-slate-500 text-xs font-bold uppercase tracking-wider hover:text-slate-300">
      ← Volver
    </button>
  </div>
</div>