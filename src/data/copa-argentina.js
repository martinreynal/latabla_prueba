// Copa Argentina 2026.
// CLASIFICADOS: datos reales verificados (sorteo del 10/12/2025, Boletín AFA 6608).
// CUADRO: datos de ejemplo hasta conectar el proveedor.
import { rng } from './tercera-ejemplo.js';

export const CA_INFO = {
  edicion: 2026,
  rondaActual: 'cuartos',
  final: '4 de noviembre de 2026',
  premio: 'El campeón clasifica a la Copa Libertadores 2027.',
  defensor: 'Independiente Rivadavia (campeón 2025) quedó eliminado en cuartos de final.',
};

export const RONDAS = [
  { id: '32avos', t: '32avos', n: 32, fechas: '18 ene – 15 abr' },
  { id: '16avos', t: '16avos', n: 16, fechas: '22 abr – 17 jul' },
  { id: 'octavos', t: 'Octavos', n: 8, fechas: '12 ago – 2 sep' },
  { id: 'cuartos', t: 'Cuartos', n: 4, fechas: '9 sep – 1 oct' },
  { id: 'semis', t: 'Semis', n: 2, fechas: 'A confirmar' },
  { id: 'final', t: 'Final', n: 1, fechas: '4 nov' },
];

export const CATEGORIAS = {
  primera: { t: 'Primera', cupos: 30, regla: 'Los 30 equipos de la Primera División 2025 entran directo.' },
  nacional: { t: 'Nacional', cupos: 15, regla: 'Los 7 primeros de cada zona de la Primera Nacional 2025 y el mejor 8.º.' },
  bmetro: { t: 'B Metro', cupos: 5, regla: 'Campeón, ganador del Reducido y los 3 mejores de la tabla de la Primera B 2025 sin contar a esos dos.' },
  primerac: { t: 'Primera C', cupos: 4, regla: 'Campeón, subcampeón, ganador del Reducido y ganador del Reducido adicional de la Primera C 2025.' },
  federal: { t: 'Federal A', cupos: 10, regla: 'Los 5 primeros de cada zona de la Segunda Etapa del Federal A 2025.' },
};

// Clasificados reales. "hoy": categoría en 2026 cuando cambió respecto de 2025.
export const CLASIFICADOS = {
  primera: ['Aldosivi', 'Argentinos Juniors', 'Atlético Tucumán', 'Banfield', 'Barracas Central', 'Belgrano', 'Boca Juniors', 'Central Córdoba (SdE)', 'Defensa y Justicia', 'Deportivo Riestra', 'Estudiantes (LP)', 'Gimnasia y Esgrima (LP)', { n: 'Godoy Cruz', hoy: 'Primera Nacional' }, 'Huracán', 'Independiente', { n: 'Independiente Rivadavia', nota: 'Campeón defensor' }, 'Instituto', 'Lanús', "Newell's Old Boys", 'Platense', 'Racing Club', 'River Plate', 'Rosario Central', 'San Lorenzo', { n: 'San Martín (SJ)', hoy: 'Primera Nacional' }, 'Sarmiento (J)', 'Talleres (C)', 'Tigre', 'Unión', 'Vélez Sarsfield'],
  nacional: ['Agropecuario Argentino', 'Atlanta', 'Chaco For Ever', 'Deportivo Madryn', 'Deportivo Maipú', 'Deportivo Morón', 'Estudiantes (BA)', { n: 'Estudiantes (RC)', hoy: 'Primera División' }, { n: 'Gimnasia y Esgrima (M)', hoy: 'Primera División' }, 'Gimnasia y Esgrima (J)', 'Gimnasia y Tiro', 'San Martín (T)', 'San Miguel', 'Temperley', 'Tristán Suárez'],
  bmetro: [{ n: 'Midland', nota: 'Campeón 2025', hoy: 'Primera Nacional' }, { n: 'Acassuso', nota: 'Ganador del Reducido 2025', hoy: 'Primera Nacional' }, { n: 'Argentino (M)', nota: 'Entre los 3 mejores de la tabla' }, { n: 'Deportivo Armenio', nota: 'Entre los 3 mejores de la tabla' }, { n: 'Real Pilar', nota: 'Entre los 3 mejores de la tabla' }],
  primerac: [{ n: 'Deportivo Camioneros', hoy: 'Primera B' }, { n: 'Ituzaingó', hoy: 'Primera B' }, 'Claypole', 'Sportivo Barracas'],
  federal: ['Argentino (MM)', 'Atenas (RC)', { n: 'Atlético de Rafaela', hoy: 'Primera Nacional' }, { n: 'Ciudad de Bolívar', hoy: 'Primera Nacional' }, 'Deportivo Rincón', 'Gimnasia y Esgrima (Ch)', 'Olimpo', 'San Martín (F)', 'Sarmiento (LB)', 'Sportivo Belgrano'],
};

/* ---------- Cuadro de ejemplo ---------- */
const FUERZA = { primera: 0.72, nacional: 0.55, bmetro: 0.4, primerac: 0.32, federal: 0.45 };
const MOTIVO_EJ = {
  primera: 'Jugó la Primera División 2025',
  nacional: 'Entre los 7 primeros de su zona en la Primera Nacional 2025',
  bmetro: 'Entre los 3 mejores de la tabla de la Primera B 2025',
  primerac: 'Subcampeón de la Primera C 2025',
  federal: 'Top 5 de su zona en la Segunda Etapa del Federal A 2025',
};

function armarEquipos() {
  const lista = [];
  const add = (cat, n, pref) => { for (let i = 1; i <= n; i++) lista.push({ id: `${cat}${i}`, nombre: `${pref} ${i}`, cat, motivo: MOTIVO_EJ[cat] }); };
  add('primera', 30, 'Club Primera');
  add('nacional', 15, 'Club Nacional');
  add('bmetro', 5, 'Club B Metro');
  add('primerac', 4, 'Club Primera C');
  add('federal', 10, 'Club Federal');
  return lista;
}

export function cuadroEjemplo() {
  const r = rng(6464);
  const eq = armarEquipos();
  // Un lado: 30 de Primera + 2 de Nacional. El otro: los 32 restantes.
  const ladoA = [...eq.filter((e) => e.cat === 'primera'), ...eq.filter((e) => e.cat === 'nacional').slice(0, 2)];
  const ladoB = eq.filter((e) => !ladoA.includes(e));
  const mezclar = (a) => a.map((x) => [r(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const A = mezclar(ladoA), B = mezclar(ladoB);

  const rondas = [];
  let actuales = A.map((a, i) => [a, B[i]]);
  const jugadas = { '32avos': 32, '16avos': 16, octavos: 8, cuartos: 3, semis: 0, final: 0 };
  RONDAS.forEach((ronda, ri) => {
    const partidos = actuales.map(([l, v], k) => {
      if (!l || !v || k >= jugadas[ronda.id]) return { l, v, jugado: false, fecha: ronda.id === 'final' ? '4 nov 2026' : 'A confirmar' };
      const gl = Math.max(0, Math.round(r() * 3 * (0.5 + FUERZA[l.cat]) - 0.4));
      const gv = Math.max(0, Math.round(r() * 3 * (0.5 + FUERZA[v.cat]) - 0.4));
      let pen = null, ganaL = gl > gv;
      if (gl === gv) {
        const pl = 3 + Math.floor(r() * 3), pv = pl + (r() > 0.5 ? 1 : -1);
        pen = [pl, Math.max(0, pv)];
        ganaL = pen[0] > pen[1];
      }
      return { l, v, gl, gv, pen, ganador: ganaL ? l : v, jugado: true, fecha: ronda.fechas.split(' – ')[0] + ' 2026' };
    });
    rondas.push({ ...ronda, partidos });
    const sig = [];
    for (let k = 0; k < partidos.length; k += 2) sig.push([partidos[k]?.ganador ?? null, partidos[k + 1]?.ganador ?? null]);
    actuales = sig;
  });
  return rondas;
}
