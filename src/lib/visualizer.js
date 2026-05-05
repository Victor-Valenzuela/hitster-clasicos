let audioCtx;
let analyser;
let source;
let dataArray;
let conectado = false;

export function conectarAudio(audioElement) {
    if (conectado) return;
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    conectado = true;
}

export function obtenerFrecuencias() {
    if (!analyser || !dataArray) return null;
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
}

export function resumirContexto() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function estaConectado() {
    return conectado;
}

export function obtenerAudioContext() {
    return audioCtx;
}

export function obtenerSource() {
    return source;
}