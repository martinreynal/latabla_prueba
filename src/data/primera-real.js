// Primera División 2026: tabla anual y promedios reales, cargados a mano.
// Fuente: capturas enviadas por Martin el 12/11/2026, en el orden oficial que muestran.
// Los id coinciden con los de ESPN, así se enlazan con las zonas en vivo y con los perfiles.

export const PRIMERA_REAL = {
  actualizado: '12/11/2026',
  // Clubes que ya tienen Libertadores 2027 por título y liberan su cupo de la tabla anual.
  clasificadosPorTitulo: [{ id: 'espn-4', motivo: 'Campeón Apertura 2026' }],
};

// [id ESPN, nombre, PJ, G, E, P, GF, GC]  ·  Pts = 3G + E
const ANUAL = [
  [5, 'Boca Juniors', 32, 17, 12, 3, 46, 23],
  [17, 'Rosario Central', 32, 18, 8, 6, 46, 28],
  [3, 'Argentinos Juniors', 32, 17, 9, 6, 37, 27],
  [9744, 'Independiente Rivadavia', 32, 16, 9, 7, 50, 39],
  [9, 'Gimnasia La Plata', 32, 17, 6, 9, 44, 39],
  [21, 'Vélez Sarsfield', 32, 14, 14, 4, 43, 29],
  [16, 'River Plate', 32, 17, 4, 11, 43, 26],
  [2975, 'Instituto (Córdoba)', 32, 16, 7, 9, 43, 32],
  [12, 'Lanús', 32, 13, 11, 8, 37, 27],
  [4, 'Belgrano (Córdoba)', 32, 13, 10, 9, 34, 28],
  [8, 'Estudiantes de La Plata', 32, 13, 8, 11, 40, 29],
  [10060, 'Barracas Central', 32, 12, 11, 9, 32, 28],
  [8950, 'Defensa y Justicia', 32, 12, 11, 9, 39, 36],
  [11, 'Independiente', 32, 12, 11, 9, 39, 36],
  [10, 'Huracán', 32, 11, 11, 10, 31, 29],
  [20, 'Unión (Santa Fe)', 32, 11, 9, 12, 48, 44],
  [11972, 'Gimnasia (Mendoza)', 32, 11, 8, 13, 32, 39],
  [18, 'San Lorenzo', 32, 10, 11, 11, 23, 30],
  [10158, 'Sarmiento (Junín)', 32, 12, 4, 16, 36, 44],
  [7767, 'Tigre', 32, 9, 12, 11, 34, 31],
  [19, 'Talleres (Córdoba)', 32, 10, 9, 13, 34, 36],
  [14, "Newell's Old Boys", 32, 8, 14, 10, 31, 40],
  [15, 'Racing Club', 32, 9, 9, 14, 33, 39],
  [7764, 'Platense', 32, 8, 12, 12, 28, 35],
  [235, 'Banfield', 32, 8, 9, 15, 35, 44],
  [9785, 'Atlético Tucumán', 32, 7, 11, 14, 31, 37],
  [11989, 'Central Córdoba (Santiago del Estero)', 32, 6, 9, 17, 23, 47],
  [17702, 'Deportivo Riestra', 32, 3, 14, 15, 16, 31],
  [9739, 'Aldosivi', 32, 3, 10, 19, 22, 45],
  [19685, 'Estudiantes de Río Cuarto', 32, 3, 5, 24, 15, 47],
];

// [id ESPN, nombre, PJ, puntos 2024, 2025, 2026]  ·  Prom = total / PJ
const PROMEDIOS = [
  [5, 'Boca Juniors', 105, 67, 62, 63],
  [16, 'River Plate', 105, 70, 53, 55],
  [17, 'Rosario Central', 105, 47, 66, 62],
  [3, 'Argentinos Juniors', 105, 56, 57, 60],
  [21, 'Vélez Sarsfield', 105, 76, 40, 56],
  [12, 'Lanús', 105, 59, 50, 50],
  [15, 'Racing Club', 105, 70, 53, 36],
  [11, 'Independiente', 105, 63, 47, 47],
  [10, 'Huracán', 105, 62, 47, 44],
  [8, 'Estudiantes de La Plata', 105, 63, 42, 47],
  [9744, 'Independiente Rivadavia', 105, 46, 43, 57],
  [10060, 'Barracas Central', 105, 49, 49, 47],
  [19, 'Talleres (Córdoba)', 105, 72, 34, 39],
  [9, 'Gimnasia La Plata', 105, 48, 38, 57],
  [8950, 'Defensa y Justicia', 105, 58, 38, 47],
  [2975, 'Instituto (Córdoba)', 105, 53, 34, 55],
  [20, 'Unión (Santa Fe)', 105, 60, 39, 42],
  [18, 'San Lorenzo', 105, 45, 51, 41],
  [4, 'Belgrano (Córdoba)', 105, 49, 37, 49],
  [11972, 'Gimnasia (Mendoza)', 32, 0, 0, 41],
  [7764, 'Platense', 105, 57, 35, 36],
  [7767, 'Tigre', 105, 39, 49, 39],
  [17702, 'Deportivo Riestra', 105, 48, 52, 23],
  [14, "Newell's Old Boys", 105, 49, 33, 38],
  [9785, 'Atlético Tucumán', 105, 50, 34, 32],
  [11989, 'Central Córdoba (Santiago del Estero)', 105, 42, 42, 27],
  [10158, 'Sarmiento (Junín)', 105, 35, 35, 40],
  [235, 'Banfield', 105, 41, 35, 33],
  [9739, 'Aldosivi', 64, 0, 33, 19],
  [19685, 'Estudiantes de Río Cuarto', 32, 0, 0, 14],
];

export const ANUAL_REAL = ANUAL.map(([id, nombre, pj, pg, pe, pp, gf, gc], i) => ({
  id: `espn-${id}`, nombre, rank: i + 1, pj, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe,
}));

export const PROMEDIOS_REAL = PROMEDIOS.map(([id, nombre, pj, t2024, t2025, t2026], i) => ({
  id: `espn-${id}`, nombre, rank: i + 1, pj, t2024, t2025, t2026, pts: t2024 + t2025 + t2026,
}));
