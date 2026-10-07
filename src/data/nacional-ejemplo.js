// DATOS DE EJEMPLO de la Primera Nacional 2026 (nombres genéricos, números inventados).
// Se reemplazan por los del proveedor en vivo. Forma esperada de cada equipo:
// { id, nombre, zona, pj, pg, pe, pp, gf, gc, dg, pts }

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function zona(letra, seed, pj) {
  const r = rng(seed);
  return Array.from({ length: 18 }, (_, i) => {
    const pg = 4 + Math.floor(r() * 14);
    const pe = Math.floor(r() * Math.min(14, pj - pg));
    const pp = pj - pg - pe;
    const gf = Math.round(pg * 1.6 + pe * 0.9 + r() * 6);
    const gc = Math.round(pp * 1.6 + pe * 0.9 + r() * 6);
    return { id: `N${letra}${i + 1}`, nombre: `Equipo ${letra}${i + 1}`, zona: letra, pj, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe };
  });
}

export const NACIONAL_EJEMPLO = {
  fecha: 32,
  zonaA: zona('A', 4242, 32),
  zonaB: zona('B', 1717, 32),
};
