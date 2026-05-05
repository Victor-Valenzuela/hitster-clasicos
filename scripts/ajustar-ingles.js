import {
    readFileSync,
    writeFileSync
} from 'fs';

let canciones = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));

// 1. Eliminar Taylor Swift
const antes = canciones.length;
canciones = canciones.filter(c => !c.artista.toLowerCase().includes('taylor swift'));
console.log('Taylor Swift eliminadas:', antes - canciones.length);

// 2. Mover Lose Yourself a Rock/Pop Ingles con año correcto
canciones.forEach(c => {
    if (c.titulo === 'Lose Yourself' && c.artista === 'Eminem') {
        c.year = 2002;
        c.genero = 'Rock/Pop Ingles';
    }
});

// 3. Mover Spice Girls a Clasicos/Ingles
canciones.forEach(c => {
    if (c.artista.toLowerCase().includes('spice girls')) {
        c.genero = 'Clasicos/Ingles';
    }
});

// 4. Nuevas canciones
const nuevas = [
    // Eminem
    {
        titulo: "The Real Slim Shady",
        artista: "Eminem",
        year: 2000,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Stan",
        artista: "Eminem",
        year: 2000,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Without Me",
        artista: "Eminem",
        year: 2002,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Rap God",
        artista: "Eminem",
        year: 2013,
        genero: "Rock/Pop Ingles"
    },
    // 50 Cent
    {
        titulo: "In Da Club",
        artista: "50 Cent",
        year: 2003,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Candy Shop",
        artista: "50 Cent",
        year: 2005,
        genero: "Rock/Pop Ingles"
    },
    // Kanye West
    {
        titulo: "Stronger",
        artista: "Kanye West",
        year: 2007,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Gold Digger",
        artista: "Kanye West",
        year: 2005,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Heartless",
        artista: "Kanye West",
        year: 2008,
        genero: "Rock/Pop Ingles"
    },
    // Drake
    {
        titulo: "Hotline Bling",
        artista: "Drake",
        year: 2015,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "God's Plan",
        artista: "Drake",
        year: 2018,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "One Dance",
        artista: "Drake",
        year: 2016,
        genero: "Rock/Pop Ingles"
    },
    // Black Eyed Peas
    {
        titulo: "Where Is the Love",
        artista: "The Black Eyed Peas",
        year: 2003,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "I Gotta Feeling",
        artista: "The Black Eyed Peas",
        year: 2009,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Boom Boom Pow",
        artista: "The Black Eyed Peas",
        year: 2009,
        genero: "Rock/Pop Ingles"
    },
    // Maroon 5
    {
        titulo: "This Love",
        artista: "Maroon 5",
        year: 2004,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "She Will Be Loved",
        artista: "Maroon 5",
        year: 2004,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Moves Like Jagger",
        artista: "Maroon 5",
        year: 2011,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Sugar",
        artista: "Maroon 5",
        year: 2015,
        genero: "Rock/Pop Ingles"
    },
    // Arctic Monkeys
    {
        titulo: "Do I Wanna Know?",
        artista: "Arctic Monkeys",
        year: 2013,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "R U Mine?",
        artista: "Arctic Monkeys",
        year: 2012,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "505",
        artista: "Arctic Monkeys",
        year: 2007,
        genero: "Rock/Pop Ingles"
    },
    // Muse
    {
        titulo: "Uprising",
        artista: "Muse",
        year: 2009,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Supermassive Black Hole",
        artista: "Muse",
        year: 2006,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Hysteria",
        artista: "Muse",
        year: 2003,
        genero: "Rock/Pop Ingles"
    },
    // My Chemical Romance
    {
        titulo: "Welcome to the Black Parade",
        artista: "My Chemical Romance",
        year: 2006,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Helena",
        artista: "My Chemical Romance",
        year: 2004,
        genero: "Rock/Pop Ingles"
    },
    // Blink-182
    {
        titulo: "All the Small Things",
        artista: "Blink-182",
        year: 1999,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "I Miss You",
        artista: "Blink-182",
        year: 2003,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "What's My Age Again?",
        artista: "Blink-182",
        year: 1999,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "Dammit",
        artista: "Blink-182",
        year: 1997,
        genero: "Clasicos/Ingles"
    },
    // Panic! At the Disco
    {
        titulo: "I Write Sins Not Tragedies",
        artista: "Panic! At the Disco",
        year: 2005,
        genero: "Rock/Pop Ingles"
    },
    // MGMT
    {
        titulo: "Kids",
        artista: "MGMT",
        year: 2007,
        genero: "Rock/Pop Ingles"
    },
    // Tame Impala
    {
        titulo: "The Less I Know the Better",
        artista: "Tame Impala",
        year: 2015,
        genero: "Rock/Pop Ingles"
    },
    // The Strokes
    {
        titulo: "Last Nite",
        artista: "The Strokes",
        year: 2001,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Reptilia",
        artista: "The Strokes",
        year: 2003,
        genero: "Rock/Pop Ingles"
    },
    // Backstreet Boys
    {
        titulo: "I Want It That Way",
        artista: "Backstreet Boys",
        year: 1999,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "Everybody (Backstreet's Back)",
        artista: "Backstreet Boys",
        year: 1997,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "As Long as You Love Me",
        artista: "Backstreet Boys",
        year: 1997,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "Quit Playing Games",
        artista: "Backstreet Boys",
        year: 1996,
        genero: "Clasicos/Ingles"
    },
    // Mas Red Hot Chili Peppers
    {
        titulo: "Otherside",
        artista: "Red Hot Chili Peppers",
        year: 1999,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "Scar Tissue",
        artista: "Red Hot Chili Peppers",
        year: 1999,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "Give It Away",
        artista: "Red Hot Chili Peppers",
        year: 1991,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "By the Way",
        artista: "Red Hot Chili Peppers",
        year: 2002,
        genero: "Rock/Pop Ingles"
    },
    {
        titulo: "Dani California",
        artista: "Red Hot Chili Peppers",
        year: 2006,
        genero: "Rock/Pop Ingles"
    },
    // Mas Spice Girls
    {
        titulo: "Say You'll Be There",
        artista: "Spice Girls",
        year: 1996,
        genero: "Clasicos/Ingles"
    },
    {
        titulo: "2 Become 1",
        artista: "Spice Girls",
        year: 1996,
        genero: "Clasicos/Ingles"
    },
];

let added = 0;
for (const n of nuevas) {
    const exists = canciones.some(c =>
        c.titulo.toLowerCase() === n.titulo.toLowerCase() &&
        c.artista.toLowerCase() === n.artista.toLowerCase()
    );
    if (!exists) {
        canciones.push(n);
        added++;
    }
}

// 5. Verificar que no haya canciones mal clasificadas
let fixes = 0;
canciones.forEach(c => {
    if (c.genero === 'Clasicos/Ingles' && c.year >= 2000) {
        c.genero = 'Rock/Pop Ingles';
        fixes++;
    }
    if (c.genero === 'Rock/Pop Ingles' && c.year < 2000) {
        c.genero = 'Clasicos/Ingles';
        fixes++;
    }
});

writeFileSync('src/data/clasicos.json', JSON.stringify(canciones, null, 2));

const cl = canciones.filter(c => c.genero === 'Clasicos/Ingles').length;
const rp = canciones.filter(c => c.genero === 'Rock/Pop Ingles').length;
console.log('Nuevas agregadas:', added);
console.log('Reclasificadas por año:', fixes);
console.log('Clasicos/Ingles (pre-2000):', cl);
console.log('Rock/Pop Ingles (2000+):', rp);
console.log('Total canciones:', canciones.length);