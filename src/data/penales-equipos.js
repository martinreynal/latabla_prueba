// Equipos del juego de penales: los 30 de Primera División 2026, con los colores de su camiseta.
// [id ESPN, nombre, nombre corto para el marcador, color 1, color 2, patrón, pantalón, medias]
// Patrones: liso · rayas (verticales) · banda (horizontal) · franja (diagonal) · mitades · v
const E = [
  [9739, 'Aldosivi', 'Aldosivi', '#1f8a3b', '#f2d21b', 'rayas', '#1f8a3b', '#1f8a3b'],
  [3, 'Argentinos Juniors', 'Argentinos', '#d2232a', '#ffffff', 'liso', '#ffffff', '#d2232a'],
  [9785, 'Atlético Tucumán', 'Atl. Tucumán', '#7cc0ea', '#ffffff', 'rayas', '#1c2a4a', '#ffffff'],
  [235, 'Banfield', 'Banfield', '#ffffff', '#1c8a45', 'rayas', '#ffffff', '#ffffff'],
  [10060, 'Barracas Central', 'Barracas', '#d2232a', '#ffffff', 'rayas', '#ffffff', '#d2232a'],
  [4, 'Belgrano', 'Belgrano', '#6cb4e4', '#ffffff', 'liso', '#15171c', '#6cb4e4'],
  [5, 'Boca Juniors', 'Boca', '#123f8c', '#f5c400', 'banda', '#123f8c', '#123f8c'],
  [11989, 'Central Córdoba (SdE)', 'Ctral. Córdoba', '#15171c', '#ffffff', 'rayas', '#15171c', '#15171c'],
  [8950, 'Defensa y Justicia', 'Defensa', '#f2d21b', '#1c8a45', 'liso', '#1c8a45', '#f2d21b'],
  [17702, 'Deportivo Riestra', 'Riestra', '#ffffff', '#15171c', 'rayas', '#15171c', '#ffffff'],
  [8, 'Estudiantes de La Plata', 'Estudiantes', '#d2232a', '#ffffff', 'rayas', '#15171c', '#d2232a'],
  [19685, 'Estudiantes de Río Cuarto', 'Est. Río Cuarto', '#7cc0ea', '#ffffff', 'rayas', '#15171c', '#ffffff'],
  [9, 'Gimnasia La Plata', 'Gimnasia LP', '#ffffff', '#1a2a5e', 'banda', '#ffffff', '#1a2a5e'],
  [11972, 'Gimnasia (Mendoza)', 'Gimnasia Mza.', '#ffffff', '#15171c', 'banda', '#15171c', '#ffffff'],
  [10, 'Huracán', 'Huracán', '#ffffff', '#d2232a', 'liso', '#ffffff', '#ffffff'],
  [11, 'Independiente', 'Independiente', '#d2232a', '#ffffff', 'liso', '#1a2a5e', '#d2232a'],
  [9744, 'Independiente Rivadavia', 'Ind. Rivadavia', '#1f4fa3', '#ffffff', 'liso', '#1f4fa3', '#1f4fa3'],
  [2975, 'Instituto', 'Instituto', '#d2232a', '#ffffff', 'rayas', '#ffffff', '#d2232a'],
  [12, 'Lanús', 'Lanús', '#7b1e3a', '#ffffff', 'liso', '#7b1e3a', '#7b1e3a'],
  [14, "Newell's Old Boys", "Newell's", '#d2232a', '#15171c', 'mitades', '#15171c', '#15171c'],
  [7764, 'Platense', 'Platense', '#ffffff', '#5a3a22', 'banda', '#ffffff', '#5a3a22'],
  [15, 'Racing Club', 'Racing', '#7cc0ea', '#ffffff', 'rayas', '#15171c', '#ffffff'],
  [16, 'River Plate', 'River', '#ffffff', '#d2232a', 'franja', '#15171c', '#ffffff'],
  [17, 'Rosario Central', 'Central', '#123f8c', '#f5c400', 'rayas', '#123f8c', '#123f8c'],
  [18, 'San Lorenzo', 'San Lorenzo', '#1b2f6b', '#c8102e', 'rayas', '#1b2f6b', '#1b2f6b'],
  [10158, 'Sarmiento (Junín)', 'Sarmiento', '#1c7a3e', '#ffffff', 'liso', '#ffffff', '#1c7a3e'],
  [19, 'Talleres (Córdoba)', 'Talleres', '#1a2a5e', '#ffffff', 'rayas', '#1a2a5e', '#1a2a5e'],
  [7767, 'Tigre', 'Tigre', '#1b2f8a', '#d2232a', 'banda', '#1b2f8a', '#1b2f8a'],
  [20, 'Unión', 'Unión', '#d2232a', '#ffffff', 'rayas', '#15171c', '#d2232a'],
  [21, 'Vélez Sarsfield', 'Vélez', '#ffffff', '#1f4fa3', 'v', '#ffffff', '#ffffff'],
];

export const EQUIPOS_PENALES = E.map(([id, nombre, corto, c1, c2, patron, pant, medias]) => ({
  id: `espn-${id}`, nombre, corto, c1, c2, patron, pant, medias,
}));
