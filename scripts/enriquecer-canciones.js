import {
    readFileSync,
    writeFileSync
} from 'fs';

const canciones = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));
const OUTPUT = 'src/data/clasicos-con-urls.json';
const DELAY = 1000;
const BATCH_SAVE = 20;

let resultado = [];
try {
    resultado = JSON.parse(readFileSync(OUTPUT, 'utf-8'));
    console.log('Retomando desde ' + resultado.length + ' canciones ya procesadas');
} catch (e) {}

const yaProcesadas = new Set(resultado.map(function(r) {
    return r.titulo + '|' + r.artista;
}));

async function buscar(titulo, artista, intentos) {
    if (intentos === undefined) intentos = 0;
    if (intentos >= 3) return null;
    const q = encodeURIComponent(titulo + ' ' + artista);
    const url = 'https://api.deezer.com/search?q=' + q + '&limit=1';
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.warn('  Rate limit, esperando 5s... (intento ' + (intentos + 1) + '/3)');
            await new Promise(function(r) {
                setTimeout(r, 5000);
            });
            return buscar(titulo, artista, intentos + 1);
        }
        if (data.data && data.data.length > 0) {
            const r = data.data[0];
            return {
                previewUrl: r.preview || null,
                portada: r.album && r.album.cover_big ? r.album.cover_big : null,
                deezerTitulo: r.title,
                deezerArtista: r.artist ? r.artist.name : null
            };
        }
    } catch (e) {
        console.warn('  Error de red, reintentando en 3s...');
        await new Promise(function(r) {
            setTimeout(r, 3000);
        });
        return buscar(titulo, artista, intentos + 1);
    }
    return null;
}

async function main() {
    const pendientes = canciones.filter(function(c) {
        return !yaProcesadas.has(c.titulo + '|' + c.artista);
    });
    console.log('Total: ' + canciones.length + ' | Ya procesadas: ' + resultado.length + ' | Pendientes: ' + pendientes.length);
    console.log('Tiempo estimado: ~' + Math.ceil(pendientes.length * DELAY / 60000) + ' minutos\n');

    let count = 0;
    for (const cancion of pendientes) {
        count++;
        process.stdout.write('[' + (resultado.length + 1) + '/' + canciones.length + '] ' + cancion.titulo + ' - ' + cancion.artista + '... ');

        const datos = await buscar(cancion.titulo, cancion.artista);
        resultado.push({
            id: cancion.id,
            titulo: cancion.titulo,
            artista: cancion.artista,
            year: cancion.year,
            genero: cancion.genero,
            previewUrl: datos ? datos.previewUrl : null,
            portada: datos ? datos.portada : null,
            encontrada: !!datos
        });
        console.log(datos ? 'OK' : 'NO ENCONTRADA');

        if (count % BATCH_SAVE === 0) {
            writeFileSync(OUTPUT, JSON.stringify(resultado, null, 2));
            console.log('  Progreso guardado (' + resultado.length + '/' + canciones.length + ')');
        }

        await new Promise(function(r) {
            setTimeout(r, DELAY);
        });
    }

    writeFileSync(OUTPUT, JSON.stringify(resultado, null, 2));

    const encontradas = resultado.filter(function(r) {
        return r.encontrada;
    }).length;
    const conAudio = resultado.filter(function(r) {
        return r.previewUrl;
    }).length;
    const sinAudio = resultado.filter(function(r) {
        return r.encontrada && !r.previewUrl;
    }).length;
    console.log('\nListo! ' + encontradas + '/' + resultado.length + ' encontradas, ' + conAudio + ' con audio preview, ' + sinAudio + ' sin preview');
    console.log('Guardado en ' + OUTPUT);
}

main();