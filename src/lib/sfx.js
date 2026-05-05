let ctx;

function getCtx() {
    if (!ctx) ctx = new(window.AudioContext || window.webkitAudioContext)();
    return ctx;
}

function playTone(freq, duration, type = 'sine', volume = 0.6) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
}

export function sonidoAcierto() {
    playTone(523, 0.15, 'sine', 0.7);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.7), 100);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.7), 200);
}

export function sonidoFallo() {
    playTone(330, 0.2, 'square', 0.5);
    setTimeout(() => playTone(262, 0.4, 'square', 0.5), 150);
}

export function sonidoSaltar() {
    playTone(600, 0.08, 'sine', 0.5);
    setTimeout(() => playTone(500, 0.08, 'sine', 0.4), 60);
    setTimeout(() => playTone(400, 0.08, 'sine', 0.3), 120);
    setTimeout(() => playTone(300, 0.15, 'sine', 0.2), 180);
}

export function sonidoPoder() {
    playTone(440, 0.08, 'sine', 0.5);
    setTimeout(() => playTone(554, 0.08, 'sine', 0.5), 80);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.6), 160);
}

export function sonidoDesafio() {
    playTone(330, 0.1, 'square', 0.4);
    setTimeout(() => playTone(440, 0.1, 'square', 0.4), 100);
    setTimeout(() => playTone(330, 0.1, 'square', 0.4), 200);
    setTimeout(() => playTone(554, 0.2, 'square', 0.5), 300);
}

export function sonidoGanarPoder() {
    playTone(523, 0.1, 'sine', 0.5);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.5), 80);
    setTimeout(() => playTone(784, 0.1, 'sine', 0.5), 160);
    setTimeout(() => playTone(1047, 0.2, 'sine', 0.6), 240);
}