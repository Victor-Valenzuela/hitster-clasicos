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
const DELAY = 112;

function slugify(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

async function buscarDeezer(titulo, artista) {
    const q = encodeURIComponent(titulo + ' ' + artista);
    const r = await fetch('https://api.deezer.com/search?q=' + q + '&limit=1');
    const d = await r.json();
    if (d.error) {
        console.warn('  Rate limit, esperando 5s...');
        await new Promise(r => setTimeout(r, 5000));
        return buscarDeezer(titulo, artista);
    }
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

const canciones = [{
        titulo: "Bohemian Rhapsody",
        artista: "Queen",
        year: 1975
    },
    {
        titulo: "We Will Rock You",
        artista: "Queen",
        year: 1977
    },
    {
        titulo: "Don't Stop Me Now",
        artista: "Queen",
        year: 1979
    },
    {
        titulo: "Somebody to Love",
        artista: "Queen",
        year: 1976
    },
    {
        titulo: "Another One Bites the Dust",
        artista: "Queen",
        year: 1980
    },
    {
        titulo: "Stairway to Heaven",
        artista: "Led Zeppelin",
        year: 1971
    },
    {
        titulo: "Hotel California",
        artista: "Eagles",
        year: 1977
    },
    {
        titulo: "Imagine",
        artista: "John Lennon",
        year: 1971
    },
    {
        titulo: "Let It Be",
        artista: "The Beatles",
        year: 1970
    },
    {
        titulo: "Hey Jude",
        artista: "The Beatles",
        year: 1968
    },
    {
        titulo: "Come Together",
        artista: "The Beatles",
        year: 1969
    },
    {
        titulo: "Yesterday",
        artista: "The Beatles",
        year: 1965
    },
    {
        titulo: "Billie Jean",
        artista: "Michael Jackson",
        year: 1982
    },
    {
        titulo: "Thriller",
        artista: "Michael Jackson",
        year: 1982
    },
    {
        titulo: "Beat It",
        artista: "Michael Jackson",
        year: 1982
    },
    {
        titulo: "Smooth Criminal",
        artista: "Michael Jackson",
        year: 1988
    },
    {
        titulo: "Like a Prayer",
        artista: "Madonna",
        year: 1989
    },
    {
        titulo: "Material Girl",
        artista: "Madonna",
        year: 1984
    },
    {
        titulo: "Vogue",
        artista: "Madonna",
        year: 1990
    },
    {
        titulo: "Smells Like Teen Spirit",
        artista: "Nirvana",
        year: 1991
    },
    {
        titulo: "Come as You Are",
        artista: "Nirvana",
        year: 1992
    },
    {
        titulo: "Sweet Child O' Mine",
        artista: "Guns N' Roses",
        year: 1987
    },
    {
        titulo: "Welcome to the Jungle",
        artista: "Guns N' Roses",
        year: 1987
    },
    {
        titulo: "November Rain",
        artista: "Guns N' Roses",
        year: 1991
    },
    {
        titulo: "Nothing Else Matters",
        artista: "Metallica",
        year: 1991
    },
    {
        titulo: "Enter Sandman",
        artista: "Metallica",
        year: 1991
    },
    {
        titulo: "Comfortably Numb",
        artista: "Pink Floyd",
        year: 1979
    },
    {
        titulo: "Wish You Were Here",
        artista: "Pink Floyd",
        year: 1975
    },
    {
        titulo: "Another Brick in the Wall",
        artista: "Pink Floyd",
        year: 1979
    },
    {
        titulo: "Stayin' Alive",
        artista: "Bee Gees",
        year: 1977
    },
    {
        titulo: "I Want to Break Free",
        artista: "Queen",
        year: 1984
    },
    {
        titulo: "Every Breath You Take",
        artista: "The Police",
        year: 1983
    },
    {
        titulo: "Roxanne",
        artista: "The Police",
        year: 1978
    },
    {
        titulo: "With or Without You",
        artista: "U2",
        year: 1987
    },
    {
        titulo: "One",
        artista: "U2",
        year: 1991
    },
    {
        titulo: "Livin' on a Prayer",
        artista: "Bon Jovi",
        year: 1986
    },
    {
        titulo: "It's My Life",
        artista: "Bon Jovi",
        year: 2000
    },
    {
        titulo: "Back in Black",
        artista: "AC/DC",
        year: 1980
    },
    {
        titulo: "Highway to Hell",
        artista: "AC/DC",
        year: 1979
    },
    {
        titulo: "Thunderstruck",
        artista: "AC/DC",
        year: 1990
    },
    {
        titulo: "Purple Rain",
        artista: "Prince",
        year: 1984
    },
    {
        titulo: "Kiss",
        artista: "Prince",
        year: 1986
    },
    {
        titulo: "Take On Me",
        artista: "a-ha",
        year: 1985
    },
    {
        titulo: "Don't Stop Believin'",
        artista: "Journey",
        year: 1981
    },
    {
        titulo: "Africa",
        artista: "Toto",
        year: 1982
    },
    {
        titulo: "Eye of the Tiger",
        artista: "Survivor",
        year: 1982
    },
    {
        titulo: "Wonderwall",
        artista: "Oasis",
        year: 1995
    },
    {
        titulo: "Creep",
        artista: "Radiohead",
        year: 1993
    },
    {
        titulo: "Losing My Religion",
        artista: "R.E.M.",
        year: 1991
    },
    {
        titulo: "Under the Bridge",
        artista: "Red Hot Chili Peppers",
        year: 1992
    },
    {
        titulo: "Californication",
        artista: "Red Hot Chili Peppers",
        year: 1999
    },
    {
        titulo: "Zombie",
        artista: "The Cranberries",
        year: 1994
    },
    {
        titulo: "No Woman No Cry",
        artista: "Bob Marley",
        year: 1975
    },
    {
        titulo: "Is This Love",
        artista: "Bob Marley",
        year: 1978
    },
    {
        titulo: "Redemption Song",
        artista: "Bob Marley",
        year: 1980
    },
    {
        titulo: "I Will Always Love You",
        artista: "Whitney Houston",
        year: 1992
    },
    {
        titulo: "My Heart Will Go On",
        artista: "Celine Dion",
        year: 1997
    },
    {
        titulo: "I Don't Want to Miss a Thing",
        artista: "Aerosmith",
        year: 1998
    },
    {
        titulo: "Dream On",
        artista: "Aerosmith",
        year: 1973
    },
    {
        titulo: "Everybody Wants to Rule the World",
        artista: "Tears for Fears",
        year: 1985
    },
    {
        titulo: "Sweet Dreams",
        artista: "Eurythmics",
        year: 1983
    },
    {
        titulo: "Blue Monday",
        artista: "New Order",
        year: 1983
    },
    {
        titulo: "Just Like Heaven",
        artista: "The Cure",
        year: 1987
    },
    {
        titulo: "Personal Jesus",
        artista: "Depeche Mode",
        year: 1989
    },
    {
        titulo: "Enjoy the Silence",
        artista: "Depeche Mode",
        year: 1990
    },
    {
        titulo: "Bitter Sweet Symphony",
        artista: "The Verve",
        year: 1997
    },
    {
        titulo: "Iris",
        artista: "Goo Goo Dolls",
        year: 1998
    },
    {
        titulo: "Mr. Brightside",
        artista: "The Killers",
        year: 2004
    },
    {
        titulo: "Clocks",
        artista: "Coldplay",
        year: 2002
    },
    {
        titulo: "Yellow",
        artista: "Coldplay",
        year: 2000
    },
    {
        titulo: "Fix You",
        artista: "Coldplay",
        year: 2005
    },
    {
        titulo: "Viva la Vida",
        artista: "Coldplay",
        year: 2008
    },
    {
        titulo: "Toxic",
        artista: "Britney Spears",
        year: 2004
    },
    {
        titulo: "Baby One More Time",
        artista: "Britney Spears",
        year: 1999
    },
    {
        titulo: "Crazy in Love",
        artista: "Beyonce",
        year: 2003
    },
    {
        titulo: "Single Ladies",
        artista: "Beyonce",
        year: 2008
    },
    {
        titulo: "Rolling in the Deep",
        artista: "Adele",
        year: 2011
    },
    {
        titulo: "Someone Like You",
        artista: "Adele",
        year: 2011
    },
    {
        titulo: "Hello",
        artista: "Adele",
        year: 2015
    },
    {
        titulo: "Poker Face",
        artista: "Lady Gaga",
        year: 2008
    },
    {
        titulo: "Bad Romance",
        artista: "Lady Gaga",
        year: 2009
    },
    {
        titulo: "Umbrella",
        artista: "Rihanna",
        year: 2007
    },
    {
        titulo: "We Found Love",
        artista: "Rihanna",
        year: 2011
    },
    {
        titulo: "Uptown Funk",
        artista: "Bruno Mars",
        year: 2014
    },
    {
        titulo: "Just the Way You Are",
        artista: "Bruno Mars",
        year: 2010
    },
    {
        titulo: "Happy",
        artista: "Pharrell Williams",
        year: 2013
    },
    {
        titulo: "Get Lucky",
        artista: "Daft Punk",
        year: 2013
    },
    {
        titulo: "Blinding Lights",
        artista: "The Weeknd",
        year: 2020
    },
    {
        titulo: "Shape of You",
        artista: "Ed Sheeran",
        year: 2017
    },
    {
        titulo: "Thinking Out Loud",
        artista: "Ed Sheeran",
        year: 2014
    },
    {
        titulo: "Havana",
        artista: "Camila Cabello",
        year: 2017
    },
    {
        titulo: "Old Town Road",
        artista: "Lil Nas X",
        year: 2019
    },
    {
        titulo: "Shallow",
        artista: "Lady Gaga",
        year: 2018
    },
    {
        titulo: "Bohemian Like You",
        artista: "The Dandy Warhols",
        year: 2000
    },
    {
        titulo: "Seven Nation Army",
        artista: "The White Stripes",
        year: 2003
    },
    {
        titulo: "Feel Good Inc",
        artista: "Gorillaz",
        year: 2005
    },
    {
        titulo: "Somebody That I Used to Know",
        artista: "Gotye",
        year: 2011
    },
    {
        titulo: "Pumped Up Kicks",
        artista: "Foster the People",
        year: 2011
    },
    {
        titulo: "Use Somebody",
        artista: "Kings of Leon",
        year: 2008
    },
    {
        titulo: "Chasing Cars",
        artista: "Snow Patrol",
        year: 2006
    },
];

async function main() {
    const clasicos = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));
    let ok = 0,
        fail = 0;
    const nuevas = [];
    console.log('Descargando ' + canciones.length + ' canciones en ingles...\n');

    for (let i = 0; i < canciones.length; i++) {
        const c = canciones[i];
        const base = slugify(c.artista) + '_' + slugify(c.titulo);
        const mp3 = base + '.mp3';
        const jpg = base + '.jpg';
        const dMp3 = AUDIO_DIR + '/' + mp3;
        const dJpg = IMG_DIR + '/' + jpg;

        process.stdout.write('[' + (i + 1) + '/' + canciones.length + '] ' + c.titulo + ' - ' + c.artista + '... ');

        if (existsSync(dMp3) && existsSync(dJpg)) {
            console.log('YA EXISTE');
            nuevas.push({
                titulo: c.titulo,
                artista: c.artista,
                year: c.year,
                genero: 'Clasicos/Ingles',
                previewUrl: '/audio/' + mp3,
                portada: '/images/covers/' + jpg
            });
            ok++;
            continue;
        }

        const datos = await buscarDeezer(c.titulo, c.artista);
        let audioOk = false,
            imgOk = false;

        if (datos && datos.previewUrl) {
            try {
                audioOk = await descargar(datos.previewUrl, dMp3);
            } catch (e) {}
        }
        if (datos && datos.portada) {
            try {
                imgOk = await descargar(datos.portada, dJpg);
            } catch (e) {}
        }

        if (audioOk && imgOk) {
            nuevas.push({
                titulo: c.titulo,
                artista: c.artista,
                year: c.year,
                genero: 'Clasicos/Ingles',
                previewUrl: '/audio/' + mp3,
                portada: '/images/covers/' + jpg
            });
            ok++;
            console.log('OK');
        } else {
            fail++;
            console.log('FAIL');
        }

        await new Promise(r => setTimeout(r, DELAY));
    }

    // Agregar al clasicos.json
    const todas = [...clasicos, ...nuevas];
    writeFileSync('src/data/clasicos.json', JSON.stringify(todas, null, 2));
    console.log('\nListo! OK: ' + ok + ' | Fail: ' + fail + ' | Total canciones: ' + todas.length);
}

main();