// DATOS DE EJEMPLO: Cuarta y Quinta División, e Inferiores.
import { rng, equipoSimulado } from './tercera-ejemplo.js';

const zona = (r, pref, n, pj) => Array.from({ length: n }, (_, i) => equipoSimulado(r, `${pref}${i + 1}`, `Equipo ${pref}${i + 1}`, pj, r()));

const rC = rng(1414);
export const PRIMERA_C = { fecha: 27, A: zona(rC, 'CA', 14, 29), B: zona(rC, 'CB', 14, 29) };

const rP = rng(1717);
export const PROMOCIONAL = { fecha: 12, A: zona(rP, 'PA', 8, 12), B: zona(rP, 'PB', 9, 14) };

const rR = rng(2468);
export const REGIONAL = {
  regiones: ['Región 1', 'Región 2', 'Región 3', 'Región 4'].map((nombre, ri) => ({
    nombre,
    zonas: Array.from({ length: 3 }, (_, zi) => ({ nombre: `Zona ${zi + 1}`, tabla: zona(rR, `R${ri + 1}${zi + 1}-`, 4, 6) })),
  })),
};

const rL = rng(8080);
export const LIGAS = {
  ejemplo: { nombre: 'Liga Regional de ejemplo', tabla: zona(rL, 'L', 12, 22) },
};

// Inferiores: los mismos 36 clubes en todas las categorías juveniles.
const CLUBES = Array.from({ length: 36 }, (_, i) => `Club ${String(i + 1).padStart(2, '0')}`);
const rI = rng(3636);
function categoria(seed, pj) {
  const r = rng(seed);
  return CLUBES.map((n, i) => equipoSimulado(r, `J${i}`, n, pj, (r() + (i % 7) / 10) / 1.6));
}
export const INFERIORES = {
  fechaJuveniles: 27,
  reserva: Array.from({ length: 30 }, (_, i) => equipoSimulado(rI, `RS${i}`, CLUBES[i], 11, rI())),
  cuarta: categoria(401, 27), quinta: categoria(502, 27), sexta: categoria(603, 27),
  septima: categoria(704, 27), octava: categoria(805, 27), novena: categoria(906, 27),
};

// Ligas regionales: directorio por provincia (regiones geográficas).
export const PROVINCIAS = [
  ['Pampeana', ['Buenos Aires', 'La Pampa']],
  ['Centro', ['Córdoba', 'Santa Fe', 'Entre Ríos']],
  ['Cuyo', ['Mendoza', 'San Juan', 'San Luis']],
  ['NOA', ['Jujuy', 'Salta', 'Tucumán', 'Catamarca', 'Santiago del Estero', 'La Rioja']],
  ['NEA', ['Chaco', 'Corrientes', 'Formosa', 'Misiones']],
  ['Patagonia', ['Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Tierra del Fuego']],
];
const rLL = rng(5150);
export const LIGAS_POR_PROVINCIA = {
  'Buenos Aires': [
    { id: 'ej-ba-1', nombre: 'Liga de ejemplo Norte', tabla: zona(rLL, 'BN', 10, 18) },
    { id: 'ej-ba-2', nombre: 'Liga de ejemplo Sur', tabla: zona(rLL, 'BS', 12, 22) },
  ],
  'Córdoba': [{ id: 'ej-cba-1', nombre: 'Liga de ejemplo Centro', tabla: zona(rLL, 'CO', 11, 20) }],
};

// Fecha de juveniles: cruces por club y resultado en cada categoría.
export function fechaJuveniles(n = 27) {
  const r = rng(700 + n);
  const orden = CLUBES.map((c) => [r(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const cats = ['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena'];
  const partidos = [];
  for (let i = 0; i < orden.length; i += 2) {
    const res = {};
    cats.forEach((c) => { res[c] = [Math.floor(r() * 4), Math.floor(r() * 4)]; });
    partidos.push({ local: orden[i], visitante: orden[i + 1], res });
  }
  return partidos;
}
