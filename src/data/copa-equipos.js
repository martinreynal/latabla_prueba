// Los 64 participantes de la Copa Argentina 2026, por categoría de clasificación.
// [id, nombre, nombre corto, color 1, color 2, patrón, pantalón, medias]
// Patrones de camiseta: liso · rayas (verticales) · banda (horizontal) · franja (diagonal) · mitades · v
// Los colores del ascenso salen del escudo de cada club; pueden no coincidir con la camiseta titular.
const N = '#15171c', B = '#ffffff', R = '#d2232a', CE = '#7cc0ea', AZ = '#143c8c', V = '#1c8a45', AM = '#f2d21b';

const PRIMERA = [
  ['espn-9739', 'Aldosivi', 'Aldosivi', V, AM, 'rayas', V, V],
  ['espn-3', 'Argentinos Juniors', 'Argentinos', R, B, 'liso', B, R],
  ['espn-9785', 'Atlético Tucumán', 'Atl. Tucumán', CE, B, 'rayas', '#1c2a4a', B],
  ['espn-235', 'Banfield', 'Banfield', B, V, 'rayas', B, B],
  ['espn-10060', 'Barracas Central', 'Barracas C.', R, B, 'rayas', B, R],
  ['espn-4', 'Belgrano de Córdoba', 'Belgrano', '#6cb4e4', B, 'liso', N, '#6cb4e4'],
  ['espn-5', 'Boca Juniors', 'Boca', '#123f8c', '#f5c400', 'banda', '#123f8c', '#123f8c'],
  ['espn-11989', 'Central Córdoba de Santiago del Estero', 'Ctral. Córdoba', N, B, 'rayas', N, N],
  ['espn-8950', 'Defensa y Justicia', 'Defensa', AM, V, 'liso', V, AM],
  ['espn-17702', 'Deportivo Riestra', 'Riestra', B, N, 'rayas', N, B],
  ['espn-8', 'Estudiantes de La Plata', 'Estudiantes', R, B, 'rayas', N, R],
  ['espn-9', 'Gimnasia y Esgrima La Plata', 'Gimnasia LP', B, '#1a2a5e', 'banda', B, '#1a2a5e'],
  ['espn-6756', 'Godoy Cruz', 'Godoy Cruz', AZ, B, 'rayas', AZ, AZ],
  ['espn-10', 'Huracán', 'Huracán', B, R, 'liso', B, B],
  ['espn-11', 'Independiente', 'Independiente', R, B, 'liso', '#1a2a5e', R],
  ['espn-9744', 'Independiente Rivadavia', 'Ind. Rivadavia', '#1f4fa3', B, 'liso', '#1f4fa3', '#1f4fa3'],
  ['espn-2975', 'Instituto de Córdoba', 'Instituto', R, B, 'rayas', B, R],
  ['espn-12', 'Lanús', 'Lanús', '#7b1e3a', B, 'liso', '#7b1e3a', '#7b1e3a'],
  ['espn-14', "Newell's Old Boys", "Newell's", R, N, 'mitades', N, N],
  ['espn-7764', 'Platense', 'Platense', B, '#5a3a22', 'banda', B, '#5a3a22'],
  ['espn-15', 'Racing Club', 'Racing', CE, B, 'rayas', N, B],
  ['espn-16', 'River Plate', 'River', B, R, 'franja', N, B],
  ['espn-17', 'Rosario Central', 'Central', '#123f8c', '#f5c400', 'rayas', '#123f8c', '#123f8c'],
  ['espn-18', 'San Lorenzo', 'San Lorenzo', '#1b2f6b', '#c8102e', 'rayas', '#1b2f6b', '#1b2f6b'],
  ['espn-7845', 'San Martín de San Juan', 'San Martín SJ', V, N, 'rayas', N, N],
  ['espn-10158', 'Sarmiento de Junín', 'Sarmiento', '#1c7a3e', B, 'liso', B, '#1c7a3e'],
  ['espn-19', 'Talleres de Córdoba', 'Talleres', '#1a2a5e', B, 'rayas', '#1a2a5e', '#1a2a5e'],
  ['espn-7767', 'Tigre', 'Tigre', '#1b2f8a', R, 'banda', '#1b2f8a', '#1b2f8a'],
  ['espn-20', 'Unión de Santa Fe', 'Unión', R, B, 'rayas', N, R],
  ['espn-21', 'Vélez Sarsfield', 'Vélez', B, '#1f4fa3', 'v', B, B],
];
const NACIONAL = [
  ['espn-13913', 'Agropecuario', 'Agropecuario', '#14a45c', R, 'liso', '#14a45c', R],
  ['espn-10146', 'Atlanta', 'Atlanta', AZ, AM, 'rayas', AZ, AZ],
  ['espn-11963', 'Chaco For Ever', 'For Ever', N, B, 'rayas', N, N],
  ['espn-18260', 'Deportivo Madryn', 'Madryn', N, AM, 'rayas', N, N],
  ['espn-11978', 'Deportivo Maipú', 'Maipú', B, R, 'banda', N, B],
  ['espn-10154', 'Deportivo Morón', 'Morón', B, R, 'banda', B, B],
  ['espn-17352', 'Estudiantes de Caseros', 'Est. Caseros', B, N, 'rayas', N, B],
  ['espn-19685', 'Estudiantes de Río Cuarto', 'Est. Río Cuarto', CE, B, 'rayas', N, B],
  ['espn-5263', 'Gimnasia de Jujuy', 'Gimnasia Jujuy', CE, B, 'rayas', N, B],
  ['espn-11972', 'Gimnasia de Mendoza', 'Gimnasia Mza.', B, N, 'banda', N, B],
  ['espn-10743', 'Gimnasia y Tiro de Salta', 'Gimnasia y Tiro', CE, B, 'rayas', B, CE],
  ['espn-17814', 'San Martín de Tucumán', 'San Martín T.', R, B, 'rayas', B, R],
  ['espn-10058', 'San Miguel', 'San Miguel', '#148c3c', B, 'liso', B, '#148c3c'],
  ['espn-10162', 'Temperley', 'Temperley', '#3cb4dc', B, 'liso', B, '#3cb4dc'],
  ['espn-10163', 'Tristán Suárez', 'Tristán Suárez', '#2a1a6e', B, 'liso', '#2a1a6e', '#2a1a6e'],
];
const FEDERAL = [
  ['fed-argentino-monte-maiz', 'Argentino de Monte Maíz', 'Argentino MM', AZ, B, 'liso', AZ, AZ],
  ['fed-atenas-rio-cuarto', 'Atenas de Río Cuarto', 'Atenas', B, '#143c64', 'banda', '#143c64', B],
  ['espn-9747', 'Atlético de Rafaela', 'Rafaela', CE, B, 'rayas', B, CE],
  ['espn-21799', 'Ciudad de Bolívar', 'Bolívar', '#6cb4e4', '#141468', 'liso', '#141468', '#6cb4e4'],
  ['fed-deportivo-rincon', 'Deportivo Rincón', 'Rincón', AZ, '#14b4dc', 'liso', AZ, AZ],
  ['fed-gimnasia-y-esgrima-chivilcoy', 'Gimnasia de Chivilcoy', 'Gimnasia Chiv.', B, '#148c3c', 'banda', B, '#148c3c'],
  ['fed-olimpo', 'Olimpo de Bahía Blanca', 'Olimpo', AM, N, 'rayas', N, N],
  ['fed-san-martin-formosa', 'San Martín de Formosa', 'San Martín F.', B, '#14143c', 'rayas', '#14143c', B],
  ['fed-sarmiento-la-banda', 'Sarmiento de La Banda', 'Sarmiento LB', AZ, B, 'liso', B, AZ],
  ['fed-sportivo-belgrano', 'Sportivo Belgrano', 'Sp. Belgrano', '#14643c', B, 'liso', '#14643c', '#14643c'],
];
const B_METRO = [
  ['espn-10145', 'Acassuso', 'Acassuso', '#2c2c8c', B, 'liso', '#2c2c8c', '#2c2c8c'],
  ['espn-17700', 'Argentino de Merlo', 'Arg. de Merlo', '#3cb4dc', B, 'liso', B, '#3cb4dc'],
  ['espn-10152', 'Deportivo Armenio', 'Armenio', B, R, 'banda', B, B],
  ['espn-10109', 'Ferrocarril Midland', 'Midland', '#2c2c8c', B, 'rayas', '#2c2c8c', '#2c2c8c'],
  ['espn-18844', 'Real Pilar', 'Real Pilar', B, N, 'liso', N, B],
];
const PRIMERA_C = [
  ['copa-claypole', 'Claypole', 'Claypole', B, N, 'rayas', N, N],
  ['espn-18662', 'Deportivo Camioneros', 'Camioneros', '#146414', B, 'liso', '#146414', '#146414'],
  ['espn-10105', 'Ituzaingó', 'Ituzaingó', '#148c3c', B, 'liso', B, '#148c3c'],
  ['copa-sportivo-barracas', 'Sportivo Barracas', 'Sp. Barracas', '#6cb4e4', R, 'liso', B, '#6cb4e4'],
];

export const CATEGORIAS = [
  { clave: 'primera', nombre: 'Primera División', corto: 'Primera', fuerza: 1 },
  { clave: 'nacional', nombre: 'Primera Nacional', corto: 'Nacional', fuerza: 0.7 },
  { clave: 'federal', nombre: 'Federal A', corto: 'Federal A', fuerza: 0.45 },
  { clave: 'bmetro', nombre: 'Primera B Metropolitana', corto: 'Primera B', fuerza: 0.4 },
  { clave: 'c', nombre: 'Primera C', corto: 'Primera C', fuerza: 0.3 },
];
// Al bombo 1 van los 30 de Primera y los dos ascendidos desde la Primera Nacional.
const ASCENDIDOS = ['espn-19685', 'espn-11972'];

const armar = (lista, cat) => lista.map(([id, nombre, corto, c1, c2, patron, pant, medias]) => ({
  id, nombre, corto, cat, c1, c2, patron, pant, medias, bombo: cat === 'primera' || ASCENDIDOS.includes(id) ? 1 : 2,
}));
export const EQUIPOS_COPA = [
  ...armar(PRIMERA, 'primera'), ...armar(NACIONAL, 'nacional'), ...armar(FEDERAL, 'federal'), ...armar(B_METRO, 'bmetro'), ...armar(PRIMERA_C, 'c'),
];
export const equipoCopa = (id) => EQUIPOS_COPA.find((e) => e.id === id);

// Easter egg: Colón no juega esta edición, pero queda definido para un futuro modo personalizado.
export const COLON = { id: 'espn-7', nombre: 'Colón de Santa Fe', corto: 'Colón', cat: 'nacional', c1: R, c2: N, patron: 'mitades', pant: N, medias: N, bombo: 2 };
