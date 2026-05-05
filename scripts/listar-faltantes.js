import {
    readFileSync
} from 'fs';
const d = JSON.parse(readFileSync('src/data/clasicos.json', 'utf8'));
const sin = d.filter(c => !c.previewUrl);
sin.forEach((c, i) => console.log((i + 1) + '. ' + c.titulo + ' - ' + c.artista + ' (' + c.year + ') [' + c.genero + ']'));
console.log('\nTotal sin audio:', sin.length);