import {
    readFileSync,
    writeFileSync,
    mkdirSync,
    createWriteStream,
    existsSync
} from 'fs';
import {
    pipeline
} from 'stream/promises';

const canciones = JSON.parse(readFileSync('src/data/anime-test.json', 'utf-8'));
const AUDIO_DIR = 'public/audio';
const IMG_DIR = 'public/images/covers';
const DELAY = 112;

try {
    mkdirSync(AUDIO_DIR, {
        recursive: true
    });
} catch (e) {}
try {
    mkdirSync(IMG_DIR, {
        recursive: true
    });
} catch (e) {}

function slugify(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

function nombreBase(cancion) {
    return slugify(cancion.artista) + '_' + slugify(cancion.titulo);
}

async function buscarDeezer(titulo, artista) {
    const q = encodeURIComponent(titulo + ' ' + artista);
    const res = await fetch('https://api.deezer.com/search?q=' + q + '&limit=1');
    const data = await res.json();
    if (data.error) {
        console.warn('  Rate limit, esperando 5s...');
        await new Promise(r => setTimeout(r, 5000));
        return buscarDeezer(titulo, artista);
    }
    if (data.data && data.data.length > 0) {
        const r = data.data[0];
        return {
            previewUrl: r.preview || null,
            portada: r.album && r.album.cover_big ? r.album.cover_big : null
        };
    }
    return null;
}

async function descargar(url, destino) {
    const res = await fetch(url);
    if (!res.ok) return false;
    await pipeline(res.body, createWriteStream(destino));
    return true;
}

async function main() {
    let okAudio = 0,
        okImg = 0,
        fail = 0,
        skip = 0;
    const resultado = [];
    console.log('Descargando audio + portadas de ' + canciones.length + ' canciones anime...\n');

    for (let i = 0; i < canciones.length; i++) {
        const c = canciones[i];
        const base = nombreBase(c);
        const archivoMp3 = base + '.mp3';
        const archivoJpg = base + '.jpg';
        const destinoMp3 = AUDIO_DIR + '/' + archivoMp3;
        const destinoJpg = IMG_DIR + '/' + archivoJpg;

        process.stdout.write('[' + (i + 1) + '/' + canciones.length + '] ' + c.titulo + ' - ' + c.artista + '... ');

        const mp3Existe = existsSync(destinoMp3);
        const jpgExiste = existsSync(destinoJpg);

        if (mp3Existe && jpgExiste) {
            console.log('YA EXISTE');
            resultado.push({
                i,
                archivoMp3,
                archivoJpg,
                okAudio: true,
                okImg: true
            });
            skip++;
            continue;
        }

        const datos = await buscarDeezer(c.titulo, c.artista);
        let audioOk = mp3Existe;
        let imgOk = jpgExiste;

        if (datos && datos.previewUrl && !mp3Existe) {
            try {
                audioOk = await descargar(datos.previewUrl, destinoMp3);
            } catch (e) {
                audioOk = false;
            }
        }
        if (datos && datos.portada && !jpgExiste) {
            try {
                imgOk = await descargar(datos.portada, destinoJpg);
            } catch (e) {
                imgOk = false;
            }
        }

        if (audioOk) okAudio++;
        if (imgOk) okImg++;
        if (!datos) fail++;

        resultado.push({
            i,
            archivoMp3,
            archivoJpg,
            okAudio: audioOk,
            okImg: imgOk
        });
        console.log((audioOk ? 'MP3:OK' : 'MP3:FAIL') + ' ' + (imgOk ? 'IMG:OK' : 'IMG:FAIL'));

        await new Promise(r => setTimeout(r, DELAY));
    }

    // Actualizar anime-test.json con rutas locales
    const actualizadas = canciones.map(function(c, i) {
        const r = resultado.find(function(x) {
            return x.i === i;
        });
        const obj = {
            titulo: c.titulo,
            artista: c.artista,
            year: c.year,
            genero: c.genero
        };
        if (r && r.okAudio) obj.previewUrl = '/audio/' + r.archivoMp3;
        if (r && r.okImg) obj.portada = '/images/covers/' + r.archivoJpg;
        return obj;
    });
    writeFileSync('src/data/anime-test.json', JSON.stringify(actualizadas, null, 2));

    console.log('\nListo!');
    console.log('Audio: ' + okAudio + ' descargados, ' + skip + ' ya existian, ' + fail + ' no encontrados');
    console.log('Portadas: ' + okImg + ' descargadas');
}

main();