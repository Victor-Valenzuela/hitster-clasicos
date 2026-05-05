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

const AUDIO_DIR = 'public/audio';
const IMG_DIR = 'public/images/covers';

function slugify(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

async function buscarDeezer(titulo, artista) {
    const q = encodeURIComponent(titulo + ' ' + artista);
    const r = await fetch('https://api.deezer.com/search?q=' + q + '&limit=1');
    const d = await r.json();
    if (d.data && d.data.length > 0) {
        return {
            previewUrl: d.data[0].preview || null,
            portada: d.data[0].album && d.data[0].album.cover_big ? d.data[0].album.cover_big : null
        };
    }
    return null;
}

async function descargar(url, destino) {
    const r = await fetch(url);
    if (!r.ok) return false;
    await pipeline(r.body, createWriteStream(destino));
    return true;
}

// Correcciones: [indice_original_titulo, nuevo_titulo, nuevo_artista, nuevo_year, nuevo_genero]
const correcciones = [
    ['Como Yo Nadie Te Ha Amado', 'Como Yo Nadie Te Ha Amado', 'Bon Jovi', 2006, 'Rock/Pop'],
    ['Pasacalle', 'Pobrecito Mi Patrón', 'Facundo Cabral', 1970, 'Trova/Cantautor'],
    ['Quiero Ser Tu Sombra', 'La Rueda', 'Frankie Ruiz', 1985, 'Tropical'],
    ['Cómo Te Va Mi Amor', 'Cómo Te Va Mi Amor', 'Pandora', 1988, 'Balada'],
    ['Gata Gangster', 'Gata Gangster', 'Daddy Yankee', 2002, 'Reggaeton'],
    ['Dime Si Te Vas Con Él', 'Dime Si Te Vas Con Él', 'Flex', 2005, 'Reggaeton'],
    ['Llamé Pa\' Verte', 'Llamé Pa\' Verte', 'Wisin & Yandel', 2005, 'Reggaeton'],
    ['Cayo El Sol', 'Cayo El Sol', 'Don Omar', 2010, 'Reggaeton'],
    ['Mueva la colita', 'A Mover La Colita', 'La Sonora Dinamita', 1997, 'Cumbia'],
    ['Llegó el sabor', 'Llegó El Sabor', 'Oscar D\'León', 1994, 'Tropical'],
    ['Reloj No Marques Las Horas', 'El Reloj', 'Los Panchos', 1950, 'Clásicos Latinos'],
    ['Es mentira', 'Es Mentira', 'Joaquín Sabina', 1998, 'Rock/Pop'],
    ['Chica De TV', 'Mayonesa', 'Chocolate', 2002, 'Cumbia'],
    ['Alma Llanera', 'Alma Llanera', 'Simon Diaz', 1914, 'Clásicos Latinos'],
    ['Taboga', 'Taboga', 'Dimension Latina', 1988, 'Tropical'],
    ['Abaniquéame', 'Pa\' Que Retozen', 'Tego Calderón', 2003, 'Reggaeton'],
    ['No Notas Que Tiemblo', 'No Notas Que Estoy Temblando', 'Lolita', 1985, 'Rock/Pop'],
];

async function main() {
    const canciones = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));
    let ok = 0,
        fail = 0;

    for (const [tituloOriginal, nuevoTitulo, nuevoArtista, nuevoYear, nuevoGenero] of correcciones) {
        const idx = canciones.findIndex(c => c.titulo === tituloOriginal && !c.previewUrl);
        if (idx === -1) {
            console.log('NO ENCONTRADA EN JSON: ' + tituloOriginal);
            continue;
        }

        console.log('[' + (ok + fail + 1) + '/17] ' + nuevoTitulo + ' - ' + nuevoArtista + '...');

        // Actualizar datos
        canciones[idx].titulo = nuevoTitulo;
        canciones[idx].artista = nuevoArtista;
        canciones[idx].year = nuevoYear;
        canciones[idx].genero = nuevoGenero;

        // Buscar en Deezer
        const datos = await buscarDeezer(nuevoTitulo, nuevoArtista);
        if (datos && datos.previewUrl) {
            const base = slugify(nuevoArtista) + '_' + slugify(nuevoTitulo);
            const mp3 = base + '.mp3';
            const jpg = base + '.jpg';

            try {
                await descargar(datos.previewUrl, AUDIO_DIR + '/' + mp3);
                canciones[idx].previewUrl = '/audio/' + mp3;
                console.log('  MP3: OK');
            } catch (e) {
                console.log('  MP3: FAIL');
            }

            if (datos.portada) {
                try {
                    await descargar(datos.portada, IMG_DIR + '/' + jpg);
                    canciones[idx].portada = '/images/covers/' + jpg;
                    console.log('  IMG: OK');
                } catch (e) {
                    console.log('  IMG: FAIL');
                }
            }
            ok++;
        } else {
            console.log('  DEEZER: NO ENCONTRADA');
            fail++;
        }
        await new Promise(r => setTimeout(r, 200));
    }

    writeFileSync('src/data/clasicos.json', JSON.stringify(canciones, null, 2));
    console.log('\nListo! OK: ' + ok + ' | Fail: ' + fail);
}

main();