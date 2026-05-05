import {
    readFileSync,
    writeFileSync
} from 'fs';

const c = JSON.parse(readFileSync('src/data/clasicos.json', 'utf-8'));
console.log('Antes:', c.length);

// Covers a eliminar (dejar solo la original)
const eliminar = [
    // Covers reales - eliminar la versión cover
    {
        titulo: 'Solamente Una Vez',
        artista: 'Luis Miguel'
    },
    {
        titulo: 'Cucurrucucú Paloma',
        artista: 'Caetano Veloso'
    },
    {
        titulo: 'Cómo Te Extraño Mi Amor',
        artista: 'Café Tacuba'
    },
    {
        titulo: 'El Día Que Me Quieras',
        artista: 'Luis Miguel'
    },
    {
        titulo: 'Piensa En Mi',
        artista: 'Leandro & Leonardo'
    },
    {
        titulo: 'México Lindo y Querido',
        artista: 'María José Quintanilla'
    },
    {
        titulo: 'Y Cómo Es Él',
        artista: 'Marc Anthony'
    },
    {
        titulo: 'Amor Eterno',
        artista: 'Rocío Dúrcal'
    },
    {
        titulo: 'El Reloj',
        artista: 'Lucho Gatica'
    },
    // Mismas canciones - eliminar la versión más nueva
    {
        titulo: 'No Te Creas Tan Importante',
        artista: 'Vian Yovi'
    },
    {
        titulo: 'La ventanita',
        artista: 'Garibaldi'
    },
    {
        titulo: 'Así Fue',
        artista: 'Isabel Pantoja'
    },
    {
        titulo: 'Crazy',
        artista: 'Gnarls Barkley'
    },
    {
        titulo: 'Stronger',
        artista: 'Kanye West'
    },
    {
        titulo: 'Stay',
        artista: 'The Kid LAROI & Justin Bieber'
    },
];

const filtrado = c.filter(cancion => {
    for (const e of eliminar) {
        if (cancion.titulo === e.titulo && cancion.artista === e.artista) {
            console.log('Eliminada:', cancion.titulo, '-', cancion.artista);
            return false;
        }
    }
    return true;
});

console.log('Después:', filtrado.length, 'Eliminadas:', c.length - filtrado.length);
writeFileSync('src/data/clasicos.json', JSON.stringify(filtrado, null, 2));