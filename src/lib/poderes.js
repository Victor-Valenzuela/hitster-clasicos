// Costes de poderes
export const PODERES = {
    saltar: {
        coste: 1,
        emoji: "⏭️",
        nombre: "Saltar"
    },
    pista: {
        coste: 2,
        emoji: "🔍",
        nombre: "Pista"
    },
    modoDificil: {
        coste: 2,
        emoji: "🔥",
        nombre: "Modo difícil"
    },
    intercambio: {
        coste: 2,
        emoji: "🔀",
        nombre: "Intercambio"
    },
    dobleONada: {
        coste: 3,
        emoji: "🎵",
        nombre: "Doble o nada"
    },
    desafio: {
        coste: 1,
        emoji: "🎯",
        nombre: "Desafío"
    },
    bloqueo: {
        coste: 2,
        emoji: "🛡️",
        nombre: "Bloqueo"
    },
};

// Calcula ⚡ ganados según lo que acertó
export function calcularPoder(acertoAno, acertoArtista, acertoCancion) {
    if (!acertoAno) return 0;
    if (acertoArtista && acertoCancion) return 3;
    if (acertoArtista || acertoCancion) return 1;
    return 0;
}

// Valida texto ingresado vs respuesta correcta (flexible)
export function validarTexto(input, correcto) {
    if (!input || !correcto) return false;
    const normalizar = (t) =>
        t.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const a = normalizar(input);
    const b = normalizar(correcto);
    if (a === b) return true;
    // Aceptar si uno contiene al otro (ej: "Shakira" vs "Shakira Isabel")
    if (a.length >= 3 && (b.includes(a) || a.includes(b))) return true;
    // Similitud por distancia: tolerar 1-2 errores tipográficos
    if (a.length >= 4 && b.length >= 4) {
        const maxDist = Math.max(a.length, b.length) <= 6 ? 1 : 2;
        if (distanciaLevenshtein(a, b) <= maxDist) return true;
    }
    return false;
}

function distanciaLevenshtein(a, b) {
    const m = a.length,
        n = b.length;
    const dp = Array.from({
        length: m + 1
    }, (_, i) => {
        const row = new Array(n + 1);
        row[0] = i;
        return row;
    });
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ?
                dp[i - 1][j - 1] :
                1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// Verifica si el jugador puede usar un poder
export function puedeUsarPoder(jugador, poderKey) {
    const poder = PODERES[poderKey];
    if (!poder) return false;
    return (jugador.poderes || 0) >= poder.coste;
}

// Aplica el coste de un poder al jugador
export function gastarPoder(jugador, poderKey) {
    const poder = PODERES[poderKey];
    if (!poder) return jugador;
    return {
        ...jugador,
        poderes: (jugador.poderes || 0) - poder.coste
    };
}

// Genera pista: rango de 20 años que siempre cubre al menos 2 posiciones en la colección
export function generarPista(ano, linea = []) {
    const decada = Math.floor(ano / 10) * 10;
    let inicio = decada - 10;
    let fin = decada + 9;

    if (linea.length > 0) {
        const anios = linea.map(c => c.year).sort((a, b) => a - b);

        // Contar cuántas cartas caen dentro del rango
        const dentroDelRango = anios.filter(a => a >= inicio && a <= fin);

        // Si hay 0 o 1 carta en el rango, la posición es obvia → expandir
        if (dentroDelRango.length < 2) {
            // Encontrar la carta más cercana al año real
            let cercana = anios[0];
            for (const a of anios) {
                if (Math.abs(a - ano) < Math.abs(cercana - ano)) cercana = a;
            }
            // Crear rango que cubra tanto el año real como la carta cercana, con margen
            const limMin = Math.min(ano, cercana);
            const limMax = Math.max(ano, cercana);
            inicio = Math.floor(limMin / 10) * 10 - 10;
            fin = Math.ceil((limMax + 1) / 10) * 10 + 9;
        }
    }

    return `La canción es de entre ${inicio} y ${fin}`;
}