// Torneo Regional Federal Amateur 2026 · Primera ronda (terminada).
// Transcripto de las imágenes publicadas por ascensodelinterior.com.ar (14/11/2026).
// Cada región está en src/data/regional/<región>.txt: "nombre|PTS|PJ|PG|PE|PP|GF|GC".
// Prefijo "++": clasifica directo a la tercera ronda · "+": clasifica a la segunda ronda.
import norte from './regional/norte.txt?raw';
import litoralNorte from './regional/litoral-norte.txt?raw';
import litoralSur from './regional/litoral-sur.txt?raw';
import centro from './regional/centro.txt?raw';
import cuyo from './regional/cuyo.txt?raw';
import pampeanaNorte from './regional/pampeana-norte.txt?raw';
import pampeanaSur from './regional/pampeana-sur.txt?raw';
import patagonia from './regional/patagonia.txt?raw';

export const REGIONAL_ACTUALIZADO = '14/11/2026';
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function leer(nombre, texto) {
  const region = { nombre, zonas: [], tercera: 0, segunda: 0 };
  let zona = null;
  for (const l of texto.split('\n').map((x) => x.trim()).filter(Boolean)) {
    if (l.startsWith('##')) { zona = { nombre: l.slice(2).trim(), tabla: [] }; region.zonas.push(zona); continue; }
    if (l.startsWith('#')) continue;
    const pasa = l.startsWith('++') ? 'tercera' : l.startsWith('+') ? 'segunda' : null;
    const [nom, ...v] = l.replace(/^\++/, '').split('|');
    const [pts, pj, pg, pe, pp, gf, gc] = v.map(Number);
    if (pasa) region[pasa]++;
    zona.tabla.push({ id: `reg-${slug(nom)}`, nombre: nom, rank: zona.tabla.length + 1, pts, pj, pg, pe, pp, gf, gc, dg: gf - gc, pasa, region: nombre, zona: zona.nombre });
  }
  return region;
}

export const REGIONES = [
  leer('Norte', norte), leer('Litoral Norte', litoralNorte), leer('Litoral Sur', litoralSur), leer('Centro', centro),
  leer('Cuyo', cuyo), leer('Pampeana Norte', pampeanaNorte), leer('Pampeana Sur', pampeanaSur), leer('Patagonia', patagonia),
];
export const CLUBES_REGIONAL = REGIONES.flatMap((r) => r.zonas.flatMap((z) => z.tabla));
