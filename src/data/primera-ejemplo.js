// DATOS DE EJEMPLO para diseñar la pantalla de Primera División.
// Nombres genéricos y números inventados: se reemplazan por los del proveedor en vivo.
// La forma de los objetos es la que va a tener que devolver Supabase.

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function zona(letra, seed) {
  const r = rng(seed);
  return Array.from({ length: 15 }, (_, i) => {
    const pg = Math.floor(r() * 7), pe = Math.floor(r() * (10 - pg));
    const pp = 10 - pg - pe;
    const gf = pg * 2 + pe + Math.floor(r() * 4), gc = pp * 2 + pe + Math.floor(r() * 3);
    return { id: `${letra}${i + 1}`, nombre: `Equipo ${letra}${i + 1}`, zona: letra, pj: 10, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe };
  });
}

const zonaA = zona('A', 7);
const zonaB = zona('B', 91);
const todos = [...zonaA, ...zonaB];

const r = rng(333);
// Tabla anual = puntos de la fase de zonas del Apertura + Clausura
const anual = todos.map((e) => {
  const ptsApertura = 12 + Math.floor(r() * 21);
  const dgApertura = Math.floor(r() * 21) - 10;
  return { id: e.id, nombre: e.nombre, zona: e.zona, pj: 16 + e.pj, dg: e.dg + dgApertura, pts: e.pts + ptsApertura };
});

// Promedios: últimas tres temporadas
const promedios = anual.map((e) => {
  const t2024 = 30 + Math.floor(r() * 30), t2025 = 30 + Math.floor(r() * 30);
  const pj = 27 + 32 + e.pj;
  return { id: e.id, nombre: e.nombre, t2024, t2025, t2026: e.pts, pj, pts: t2024 + t2025 + e.pts };
});

export const PRIMERA_EJEMPLO = {
  torneo: 'Torneo Clausura',
  fecha: 10,
  zonaA,
  zonaB,
  anual,
  promedios,
  // Equipos que ya tienen Libertadores por título (Apertura, Clausura, Copa Argentina, etc.).
  // Liberan su lugar en la tabla anual.
  clasificadosPorTitulo: [{ id: 'A3', motivo: 'Campeón Apertura' }],
};
