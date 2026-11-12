// Torneo Federal A 2026: tablas y cuadro de la Reválida reales, cargados a mano.
// Fuente: CSV enviados por Martin el 12/11/2026 (federal_a_tablas.csv y federal_a_cuadro.csv).

export const FEDERAL_ACTUALIZADO = '12/11/2026';

// Nombre canónico y las formas en que aparece en cada archivo.
const CLUBES = [
  ['Douglas Haig'],
  ['Sportivo Belgrano', 'Sp. Belgrano'],
  ['Gimnasia y Esgrima (Chivilcoy)', 'Gimnasia (Chivilcoy)'],
  ['Defensores de Belgrano (VR)', 'Defensores (VR)', 'Defensores Belgrano (VR)'],
  ['9 de Julio (Rafaela)', '9 de Julio (R)', '9 de Julio Rafaela'],
  ['Sportivo Las Parejas', 'Sportivo LP'],
  ['Atlético Escobar'],
  ['Independiente (Chivilcoy)', 'Independiente (Chi)'],
  ['El Linqueño'],
  ['Gimnasia de Concepción'],
  ['San Martín (Formosa)', 'San Martín (For)', 'San Martín de Formosa'],
  ['Bartolomé Mitre (Posadas)', 'Bartolomé Mitre'],
  ['Sol de América', 'Sol De América'],
  ['Sarmiento (La Banda)', 'Sarmiento (LB)', 'Sarmiento de La Banda'],
  ['Juventud Antoniana', 'Juv. Antoniana'],
  ['Defensores (Pto. Vilelas)', 'Defensores Pto. Vilelas'],
  ['Boca Unidos (Corrientes)', 'Boca Unidos', 'Boca Unidos de Corrientes'],
  ['Tucumán Central'],
  ['Sarmiento (Resistencia)', 'Sarmiento (R)'],
  ['Cipolletti'],
  ['Argentino (Monte Maíz)', 'Argentino MM', 'Argentino Monte Maíz'],
  ['Atenas (Río Cuarto)', 'Atenas (RC)', 'Atenas Río Cuarto'],
  ['Huracán (Las Heras)', 'Huracán (LH)', 'Huracán Las Heras'],
  ['Fundación Amigos por el Deporte'],
  ['Deportivo Rincón', 'Dvo. Rincón'],
  ['San Martín (Mendoza)', 'San Martín (Mdza)', 'San Martín de Mendoza'],
  ['Costa Brava (General Pico)', 'Costa Brava', 'Costa Brava (Gral Pico)'],
  ['Juventud Unida (San Luis)', 'Juventud Unida (SL)', 'Juventud Unida San Luis'],
  ['Olimpo'],
  ['Alvarado'],
  ['Kimberley (Mar del Plata)', 'Kimberley', 'Kimberley Mar del Plata'],
  ['Villa Mitre'],
  ['Germinal'],
  ['Sol de Mayo'],
  ['Guillermo Brown', 'Gmo. Brown'],
  ['Santamarina'],
  ['Círculo Deportivo'],
];

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const POR_NOMBRE = new Map();
export const CLUBES_FEDERAL = CLUBES.map(([nombre, ...alias]) => {
  const c = { id: `fed-${slug(nombre)}`, nombre };
  [nombre, ...alias].forEach((n) => POR_NOMBRE.set(n, c));
  return c;
});
export function club(n) {
  const c = POR_NOMBRE.get(n);
  if (!c) throw new Error(`Federal A: club sin identificar "${n}"`);
  return c;
}

// [nombre, PTS, PJ, GF, GC, G, E, P] en el orden oficial de cada tabla
const T = {
  regular: {
    A: [['Douglas Haig', 31, 18, 22, 15, 9, 4, 5], ['Sp. Belgrano', 30, 18, 21, 9, 7, 9, 2], ['Gimnasia (Chivilcoy)', 27, 18, 17, 12, 7, 6, 5], ['Defensores (VR)', 27, 18, 24, 20, 7, 6, 5], ['9 de Julio (R)', 25, 18, 28, 27, 7, 4, 7], ['Sportivo LP', 24, 18, 12, 13, 5, 9, 4], ['Atlético Escobar', 22, 18, 21, 29, 6, 4, 8], ['Independiente (Chi)', 19, 18, 15, 22, 4, 7, 7], ['El Linqueño', 19, 18, 14, 21, 5, 4, 9], ['Gimnasia de Concepción', 17, 18, 12, 18, 4, 5, 9]],
    B: [['San Martín (For)', 30, 16, 25, 19, 9, 3, 4], ['Bartolomé Mitre', 26, 16, 13, 7, 7, 5, 4], ['Sol De América', 26, 16, 19, 14, 8, 2, 6], ['Sarmiento (LB)', 25, 16, 17, 15, 7, 4, 5], ['Juv. Antoniana', 25, 16, 19, 11, 7, 4, 5], ['Defensores Pto. Vilelas', 19, 16, 21, 26, 6, 1, 9], ['Boca Unidos', 18, 16, 19, 25, 5, 3, 8], ['Tucumán Central', 17, 16, 14, 19, 5, 2, 9], ['Sarmiento (R)', 15, 16, 12, 23, 3, 6, 7]],
    C: [['Cipolletti', 25, 16, 19, 15, 7, 4, 5], ['Argentino MM', 23, 16, 16, 12, 5, 8, 3], ['Atenas (RC)', 23, 16, 12, 13, 6, 5, 5], ['Huracán (LH)', 23, 16, 11, 13, 6, 5, 5], ['Fundación Amigos por el Deporte', 21, 16, 17, 14, 4, 9, 3], ['Dvo. Rincón', 19, 16, 13, 16, 5, 4, 7], ['San Martín (Mdza)', 19, 16, 11, 15, 4, 7, 5], ['Costa Brava', 18, 16, 12, 13, 4, 6, 6], ['Juventud Unida (SL)', 17, 16, 10, 10, 3, 8, 5]],
    D: [['Olimpo', 31, 16, 13, 4, 8, 7, 1], ['Alvarado', 27, 16, 19, 7, 7, 6, 3], ['Kimberley', 26, 16, 15, 9, 6, 8, 2], ['Villa Mitre', 23, 16, 14, 8, 5, 8, 3], ['Germinal', 18, 16, 7, 14, 4, 6, 6], ['Sol de Mayo', 18, 16, 15, 18, 4, 6, 6], ['Gmo. Brown', 17, 16, 13, 20, 4, 5, 7], ['Santamarina', 13, 16, 9, 17, 2, 7, 7], ['Círculo Deportivo', 13, 16, 8, 16, 2, 7, 7]],
  },
  segunda: {
    A: [['San Martín (For)', 17, 8, 14, 5, 5, 2, 1], ['Gimnasia (Chivilcoy)', 15, 8, 6, 2, 4, 3, 1], ['Sol De América', 14, 8, 9, 7, 4, 2, 2], ['Defensores (VR)', 13, 8, 6, 3, 4, 1, 3], ['Douglas Haig', 12, 8, 12, 7, 3, 3, 2], ['9 de Julio (R)', 12, 8, 9, 6, 3, 3, 2], ['Bartolomé Mitre', 5, 8, 3, 10, 1, 2, 5], ['Sarmiento (LB)', 5, 8, 6, 14, 1, 2, 5], ['Sp. Belgrano', 5, 8, 3, 14, 1, 2, 5]],
    B: [['Alvarado', 15, 8, 10, 5, 4, 3, 1], ['Cipolletti', 15, 8, 10, 7, 4, 3, 1], ['Olimpo', 13, 8, 7, 4, 3, 4, 1], ['Atenas (RC)', 13, 8, 12, 10, 4, 1, 3], ['Kimberley', 11, 8, 8, 6, 3, 2, 3], ['Argentino MM', 11, 8, 7, 7, 3, 2, 3], ['Villa Mitre', 10, 8, 5, 4, 2, 4, 2], ['Huracán (LH)', 7, 8, 3, 8, 2, 1, 5], ['Juv. Antoniana', 2, 8, 1, 12, 0, 2, 6]],
  },
  revalida: {
    A: [['Boca Unidos', 15, 8, 14, 7, 4, 3, 1], ['Gimnasia de Concepción', 14, 8, 9, 2, 4, 2, 2], ['El Linqueño', 13, 8, 8, 4, 3, 4, 1], ['Sportivo LP', 12, 8, 8, 3, 3, 3, 2], ['Defensores Pto. Vilelas', 12, 8, 14, 11, 3, 3, 2], ['Independiente (Chi)', 12, 8, 8, 5, 3, 3, 2], ['Atlético Escobar', 11, 8, 7, 12, 3, 2, 3], ['Sarmiento (R)', 6, 8, 5, 16, 2, 0, 6], ['Tucumán Central', 2, 8, 8, 21, 0, 2, 6]],
    B: [['Costa Brava', 16, 9, 11, 7, 4, 4, 1], ['San Martín (Mdza)', 16, 9, 9, 6, 4, 4, 1], ['Dvo. Rincón', 15, 9, 11, 5, 4, 3, 2], ['Fundación Amigos por el Deporte', 15, 9, 7, 4, 4, 3, 2], ['Juventud Unida (SL)', 14, 9, 7, 6, 4, 2, 3], ['Germinal', 13, 9, 10, 7, 3, 4, 2], ['Gmo. Brown', 11, 9, 6, 7, 3, 2, 4], ['Círculo Deportivo', 11, 9, 6, 7, 3, 2, 4], ['Sol de Mayo', 6, 9, 6, 14, 2, 0, 7], ['Santamarina', 6, 9, 6, 16, 2, 0, 7]],
  },
};

const fila = ([n, pts, pj, gf, gc, pg, pe, pp], i) => ({ ...club(n), rank: i + 1, pts, pj, gf, gc, dg: gf - gc, pg, pe, pp });
const conv = (zonas) => Object.fromEntries(Object.entries(zonas).map(([z, f]) => [z, f.map(fila)]));
export const REGULAR = conv(T.regular);
export const SEGUNDA = conv(T.segunda);
export const REVALIDA1 = conv(T.revalida);

// Cuadro de la Reválida: [etapa, equipo 1, global 1, global 2, equipo 2, avanza]
// avanza: nombre del que pasa · 'Sin definir' (falta la vuelta) · 'Sin jugar'
const C = [
  [2, 'Bartolomé Mitre (Posadas)', 0, 2, 'Boca Unidos de Corrientes', 'Boca Unidos de Corrientes'],
  [2, 'Defensores Pto. Vilelas', 4, 4, 'Gimnasia y Esgrima (Chivilcoy)', 'Gimnasia y Esgrima (Chivilcoy)'],
  [2, 'Sarmiento de La Banda', 1, 1, 'Sportivo Belgrano', 'Sarmiento de La Banda'],
  [2, 'Huracán Las Heras', 1, 3, 'Juventud Antoniana', 'Juventud Antoniana'],
  [2, 'Defensores Belgrano (VR)', 1, 2, 'Sportivo Las Parejas', 'Sportivo Las Parejas'],
  [2, 'Argentino Monte Maíz', 4, 1, 'San Martín de Mendoza', 'Argentino Monte Maíz'],
  [2, 'Douglas Haig', 1, 0, 'El Linqueño', 'Douglas Haig'],
  [2, 'Kimberley Mar del Plata', 3, 1, 'Deportivo Rincón', 'Kimberley Mar del Plata'],
  [2, 'Sol de América', 2, 2, 'Juventud Unida San Luis', 'Sol de América'],
  [2, 'Villa Mitre', 3, 1, 'Costa Brava (Gral Pico)', 'Villa Mitre'],
  [2, 'Atenas Río Cuarto', 3, 3, 'Fundación Amigos por el Deporte', 'Atenas Río Cuarto'],
  [2, '9 de Julio Rafaela', 2, 4, 'Gimnasia de Concepción', 'Gimnasia de Concepción'],
  [3, 'Alvarado', 2, 2, 'Sportivo Las Parejas', 'Alvarado'],
  [3, 'Gimnasia y Esgrima (Chivilcoy)', 3, 0, 'Boca Unidos de Corrientes', 'Gimnasia y Esgrima (Chivilcoy)'],
  [3, 'Olimpo', 1, 0, 'Gimnasia de Concepción', 'Olimpo'],
  [3, 'Kimberley Mar del Plata', 1, 1, 'Argentino Monte Maíz', 'Kimberley Mar del Plata'],
  [3, 'Douglas Haig', 3, 1, 'Villa Mitre', 'Douglas Haig'],
  [3, 'Sol de América', 2, 3, 'Juventud Antoniana', 'Juventud Antoniana'],
  [3, 'Atenas Río Cuarto', 4, 5, 'Sarmiento de La Banda', 'Sarmiento de La Banda'],
  [4, 'Cipolletti', 1, 0, 'Juventud Antoniana', 'Sin definir'],
  [4, 'Alvarado', 0, 1, 'Sarmiento de La Banda', 'Sarmiento de La Banda'],
  [4, 'Gimnasia y Esgrima (Chivilcoy)', 0, 1, 'Douglas Haig', 'Douglas Haig'],
  [4, 'Olimpo', null, null, 'Kimberley Mar del Plata', 'Sin jugar'],
  [5, null, null, null, null, 'Sin jugar'],
  [5, null, null, null, null, 'Sin jugar'],
];

export const ETAPAS_REVALIDA = [
  { n: 2, nombre: '2.ª etapa', detalle: '24 equipos · 12 series' },
  { n: 3, nombre: '3.ª etapa', detalle: '14 equipos · 7 series (entran los perdedores de semifinales)' },
  { n: 4, nombre: '4.ª etapa', detalle: '8 equipos · 4 series (entra el perdedor de la final)' },
  { n: 5, nombre: '5.ª etapa', detalle: 'Semifinales · a confirmar' },
];

export const CUADRO = C.map(([etapa, a, g1, g2, b, avanza]) => {
  const e1 = a ? club(a) : null;
  const e2 = b ? club(b) : null;
  let estado = 'jugada';
  let ganador = null;
  if (avanza === 'Sin definir') estado = 'en-juego';
  else if (avanza === 'Sin jugar') estado = 'pendiente';
  else ganador = club(avanza);
  return { etapa, e1, e2, g1, g2, estado, ganador };
});

// Fase Campeonato: no vino en los CSV. Los cruces salen del reglamento (1.º A vs 4.º B, etc.)
// y quién pasó se deduce de quién entró a la Reválida y en qué etapa. Sin resultados.
const c = (n) => club(n);
export const CAMPEONATO = {
  deducido: true,
  cuartos: [
    [c('San Martín (For)'), c('Atenas (RC)'), c('San Martín (For)'), '1.º A', '4.º B'],
    [c('Gimnasia (Chivilcoy)'), c('Olimpo'), c('Olimpo'), '2.º A', '3.º B'],
    [c('Alvarado'), c('Defensores (VR)'), c('Alvarado'), '1.º B', '4.º A'],
    [c('Cipolletti'), c('Sol De América'), c('Cipolletti'), '2.º B', '3.º A'],
  ],
  semis: [
    [c('San Martín (For)'), c('Olimpo'), c('San Martín (For)')],
    [c('Alvarado'), c('Cipolletti'), c('Cipolletti')],
  ],
  final: [c('San Martín (For)'), c('Cipolletti'), c('San Martín (For)')],
};
