const DEEZER_PROXY = 'https://corsproxy.io/?';

// Busca preview y portada en Deezer via proxy CORS
export async function buscarAudioDeezer(titulo, artista) {
    const q = encodeURIComponent(titulo + ' ' + artista);
    const url = DEEZER_PROXY + encodeURIComponent('https://api.deezer.com/search?q=' + q + '&limit=1');
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            const r = data.data[0];
            return {
                previewUrl: r.preview || null,
                portada: (r.album && r.album.cover_big) ? r.album.cover_big : null
            };
        }
    } catch (e) {
        console.error('Error buscando en Deezer:', e);
    }
    return null;
}

export function crearControlAudio(audioPlayer, onPlayChange) {

    function play() {
        const el = audioPlayer();
        if (!el || !el.src) return;
        const p = el.play();
        if (p && p.catch) {
            p.catch(() => {
                onPlayChange(false);
            });
        }
        onPlayChange(true);
    }

    function pause() {
        const el = audioPlayer();
        if (!el) return;
        el.pause();
        onPlayChange(false);
    }

    function toggle(isPlaying) {
        isPlaying ? pause() : play();
    }

    return {
        play,
        pause,
        toggle
    };
}