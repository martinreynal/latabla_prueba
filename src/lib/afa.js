// Tablas calculadas con los resultados publicados por la AFA (src/data/afa.json, lo genera scripts/afa).
import AFA from '../data/afa.json';

export const AFA_DATOS = AFA;
export const JUV = ['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena'];
const nombre = (id) => AFA.clubes[id] ?? id;
const orden = (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre);

// partidos: [fecha, día, local, visitante, gl, gv]
export function calcular(partidos, ids) {
  const t = new Map();
  const fila = (id) => t.get(id) ?? t.set(id, { id, nombre: nombre(id), pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }).get(id);
  (ids ?? []).forEach(fila);
  for (const [, , l, v, gl, gv] of partidos) {
    if (gl === null || gv === null) continue;
    for (const [id, a, b] of [[l, gl, gv], [v, gv, gl]]) {
      if (ids && !ids.includes(id)) continue;
      const f = fila(id);
      f.pj++; f.gf += a; f.gc += b; f.dg = f.gf - f.gc;
      if (a > b) { f.pg++; f.pts += 3; } else if (a === b) { f.pe++; f.pts++; } else f.pp++;
    }
  }
  return [...t.values()].sort(orden);
}

// Fechas con al menos un resultado, y las que faltan entre 1 y la última.
function cobertura(partidos, fechaInterzonal = null) {
  const con = new Set(partidos.filter((p) => p[4] !== null && typeof p[0] === 'number').map((p) => p[0]));
  const hayInter = partidos.some((p) => p[0] === 'interzonal' && p[4] !== null);
  if (hayInter && fechaInterzonal) con.add(fechaInterzonal);
  const nums = [...con].sort((a, b) => a - b);
  const ultima = nums[nums.length - 1] ?? 0;
  const faltan = [];
  for (let i = 1; i <= ultima; i++) if (!con.has(i)) faltan.push(i);
  return { fechas: nums, faltan, interzonal: hayInter, fechaInterzonal: hayInter ? fechaInterzonal : null };
}

export function reserva(fase) {
  const R = AFA.reserva[fase];
  if (!R || !R.partidos.length) return null;
  const cov = cobertura(R.partidos, R.fechaInterzonal);
  if (!R.zonas) return { zonas: { U: calcular(R.partidos) }, ...cov };
  const ids = (z) => Object.keys(R.zonas).filter((id) => R.zonas[id] === z);
  return { zonas: { A: calcular(R.partidos, ids('A')), B: calcular(R.partidos, ids('B')) }, ...cov };
}

export function juveniles(cat) {
  const ps = AFA.juveniles[cat] ?? [];
  return { filas: calcular(ps, Object.keys(AFA.clubes)), ...cobertura(ps) };
}

export function generalJuveniles() {
  const porClub = new Map();
  JUV.forEach((c) => juveniles(c).filas.forEach((e) => {
    const a = porClub.get(e.id) ?? { id: e.id, nombre: e.nombre, pts: 0, pj: 0, dg: 0, gf: 0, porCat: {} };
    a.pts += e.pts; a.pj += e.pj; a.dg += e.dg; a.gf += e.gf; a.porCat[c] = e.pts;
    porClub.set(e.id, a);
  }));
  return [...porClub.values()].sort(orden);
}

// Fechas de juveniles publicadas y los cruces de una fecha con las seis categorías.
export const fechasJuveniles = () => cobertura(AFA.juveniles.cuarta ?? []).fechas;
export function cruces(n) {
  const mapa = new Map();
  JUV.forEach((c, i) => {
    for (const [f, dia, l, v, gl, gv] of AFA.juveniles[c] ?? []) {
      if (f !== n) continue;
      // 4.ª a 6.ª: local el primero; 7.ª a 9.ª se juegan en la cancha del otro y la AFA los lista al revés.
      const [loc, vis, a, b] = i < 3 ? [l, v, gl, gv] : [v, l, gv, gl];
      const k = `${loc}|${vis}`;
      const x = mapa.get(k) ?? mapa.set(k, { local: nombre(loc), visitante: nombre(vis), idL: loc, idV: vis, dia, res: {} }).get(k);
      x.res[c] = gl === null ? null : [a, b];
    }
  });
  return [...mapa.values()];
}
