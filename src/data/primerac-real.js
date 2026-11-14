// Primera C 2026: tablas finales y Reducido, cargados a mano.
// Fuente: capturas enviadas por Martin el 14/11/2026. Luján ganó la final por el 1.er ascenso (AFA, 21/10/2026).

export const PRIMERAC_ACTUALIZADO = '14/11/2026';

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Clubes que ya tienen escudo con otro id (participan de la Copa Argentina).
const ID_FIJO = { Claypole: 'copa-claypole', 'Sportivo Barracas': 'copa-sportivo-barracas' };
const idC = (nombre) => ID_FIJO[nombre] ?? `c-${slug(nombre)}`;

// [nombre, PTS, PJ, GF, GC, G, E, P] en el orden oficial
const ZONAS = {
  A: [
    ['Berazategui', 51, 32, 40, 24, 13, 12, 7],
    ['Sacachispas', 50, 32, 33, 26, 14, 8, 10],
    ['Estrella del Sur', 48, 32, 33, 30, 12, 12, 8],
    ['Centro Español', 47, 32, 43, 30, 12, 11, 9],
    ['Mercedes', 47, 32, 31, 24, 12, 11, 9],
    ['Victoriano Arenas', 47, 32, 26, 19, 11, 14, 7],
    ['CA Lugano', 46, 32, 35, 29, 11, 13, 8],
    ['Juventud Unida (San Miguel)', 45, 32, 39, 33, 12, 9, 11],
    ['Puerto Nuevo', 41, 32, 30, 36, 10, 11, 11],
    ['Cambaceres', 36, 32, 25, 34, 9, 9, 14],
    ['JJ Urquiza', 35, 32, 21, 26, 7, 14, 11],
    ['Paraguayo', 32, 32, 23, 41, 7, 11, 14],
    ['Leandro N. Alem', 31, 32, 30, 58, 8, 7, 17],
    ['Argentino de Rosario', 27, 32, 30, 42, 4, 15, 13],
  ],
  B: [
    ['Luján', 64, 32, 46, 22, 19, 7, 6],
    ['Cañuelas', 61, 32, 43, 22, 17, 10, 5],
    ['Deportivo Español', 52, 32, 26, 16, 12, 16, 4],
    ['Leones de Rosario', 51, 32, 31, 25, 13, 12, 7],
    ['Central Córdoba (Rosario)', 49, 32, 32, 23, 13, 10, 9],
    ['General Lamadrid', 41, 32, 23, 27, 9, 14, 9],
    ['Sportivo Barracas', 40, 32, 32, 32, 11, 7, 14],
    ['El Porvenir', 40, 32, 28, 32, 8, 16, 8],
    ['Central Ballester', 38, 32, 29, 34, 10, 8, 14],
    ['Atlas', 37, 32, 24, 29, 9, 10, 13],
    ['Claypole', 36, 32, 27, 40, 9, 9, 14],
    ['Yupanqui', 35, 32, 33, 36, 8, 11, 13],
    ['Fénix', 34, 32, 24, 32, 8, 10, 14],
    ['Muñiz', 29, 32, 23, 38, 6, 11, 15],
  ],
};
const fila = ([nombre, pts, pj, gf, gc, pg, pe, pp], i) => ({ id: idC(nombre), nombre, rank: i + 1, pts, pj, gf, gc, dg: gf - gc, pg, pe, pp });
export const PRIMERAC = { A: ZONAS.A.map(fila), B: ZONAS.B.map(fila) };
const club = (n) => [...PRIMERAC.A, ...PRIMERAC.B].find((e) => e.nombre === n);

// Final por el 1.er ascenso: 1.º A vs 1.º B. El perdedor entra directo a semifinales del Reducido.
export const FINAL_C = { a: club('Berazategui'), b: club('Luján'), ganador: club('Luján') };

// Reducido por el 2.º ascenso. Series a ida y vuelta: [equipo 1, global 1, global 2, equipo 2, quién pasa | null]
const s = (a, g1, g2, b, pasa) => ({ a: club(a), b: club(b), g1, g2, pasa: pasa ? club(pasa) : null });
export const REDUCIDO_C = [
  { ronda: 'Octavos de final', series: [
    s('Estrella del Sur', 2, 1, 'General Lamadrid', 'Estrella del Sur'),
    s('Deportivo Español', 1, 0, 'Victoriano Arenas', 'Deportivo Español'),
    s('Cañuelas', 2, 0, 'CA Lugano', 'Cañuelas'),
    s('Centro Español', 2, 2, 'Central Córdoba (Rosario)', 'Central Córdoba (Rosario)'),
    s('Sacachispas', 1, 1, 'Sportivo Barracas', 'Sportivo Barracas'),
    s('Leones de Rosario', 2, 2, 'Mercedes', 'Leones de Rosario'),
  ] },
  { ronda: 'Cuartos de final', series: [
    s('Estrella del Sur', 1, 1, 'Deportivo Español', null),
    s('Cañuelas', 1, 1, 'Central Córdoba (Rosario)', null),
    s('Leones de Rosario', 1, 4, 'Sportivo Barracas', null),
  ] },
  { ronda: 'Semifinales', series: [
    { a: club('Berazategui'), b: null, g1: null, g2: null, pasa: null },
    { a: null, b: null, g1: null, g2: null, pasa: null },
  ] },
  { ronda: 'Final', series: [{ a: null, b: null, g1: null, g2: null, pasa: null }] },
];
