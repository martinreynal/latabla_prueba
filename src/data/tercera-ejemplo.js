// DATOS DE EJEMPLO de Tercera División 2026 (Primera B Metro y Federal A).
// Nombres genéricos y números inventados. Se reemplazan por el proveedor en vivo.

export function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function equipoSimulado(r, id, nombre, pj, fuerza = 0.5) {
  const pg = Math.min(pj, Math.round(pj * (0.15 + fuerza * 0.45 + r() * 0.2)));
  const pe = Math.min(pj - pg, Math.round((pj - pg) * (0.25 + r() * 0.35)));
  const pp = pj - pg - pe;
  const gf = Math.round(pg * 1.7 + pe * 0.9 + r() * 5);
  const gc = Math.round(pp * 1.7 + pe * 0.9 + r() * 5);
  return { id, nombre, pj, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe };
}

/* ---------- Primera B Metropolitana: 22 equipos, tabla única ---------- */
const rB = rng(2026);
export const BMETRO_EJEMPLO = {
  fecha: 34,
  tabla: Array.from({ length: 22 }, (_, i) => equipoSimulado(rB, `BM${i + 1}`, `Equipo ${String.fromCharCode(65 + i)}`, 34, rB())),
};

/* ---------- Federal A: 37 equipos, cuatro zonas (una de 10 y tres de 9) ---------- */
const rF = rng(3737);
const LETRAS = 'ABCDEFGHIJ';
function zonaFederal(z, n) {
  return Array.from({ length: n }, (_, i) =>
    equipoSimulado(rF, `F${z}${LETRAS[i]}`, `Equipo ${z}${LETRAS[i]}`, (n - 1) * 2, rF()));
}
export const FEDERAL_EJEMPLO = {
  estado: 'tercera', // fase en juego en el ejemplo: primera | segunda | tercera | cuarta | final
  zonas: { 1: zonaFederal(1, 10), 2: zonaFederal(2, 9), 3: zonaFederal(3, 9), 4: zonaFederal(4, 9) },
  seed: 99,
};
