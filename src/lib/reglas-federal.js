// Torneo Federal A 2026 (Reglamento Consejo Federal, febrero 2026).
import { rng, equipoSimulado } from '../data/tercera-ejemplo.js';

const orden = (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
export const ordenar = (t) => [...t].sort(orden);

// ---------- Primera Fase ----------
export function primeraFase(zonas) {
  const tablas = {};
  for (const z of [1, 2, 3, 4]) tablas[z] = ordenar(zonas[z]);
  // Mejor 5.º de las zonas de 9 (2, 3 y 4)
  const quintos = [2, 3, 4].map((z) => ({ ...tablas[z][4], zona: z })).sort(orden);
  const mejorQuinto = quintos[0];
  const clasifica = (z, pos, e) => (z === 1 ? pos <= 5 : pos <= 4 || e.id === mejorQuinto.id);
  return { tablas, mejorQuinto, clasifica };
}

// ---------- Segunda Fase: dos zonas de 9, una rueda, desde cero ----------
export function segundaFase(pf, seed) {
  const r = rng(seed);
  const toma = (z, n) => pf.tablas[z].slice(0, n).map((e, i) => ({ ...e, origen: `${i + 1}.º Zona ${z}` }));
  const q = pf.mejorQuinto;
  const zonaA = [...toma(1, 5), ...toma(2, 4)];
  const zonaB = [...toma(3, 4), ...toma(4, 4), { ...pf.tablas[q.zona][4], origen: `Mejor 5.º (Zona ${q.zona})` }];
  const jugar = (lista) => ordenar(lista.map((e) => ({ ...equipoSimulado(r, e.id, e.nombre, 8, r()), origen: e.origen })));
  return { A: jugar(zonaA), B: jugar(zonaB) };
}

// ---------- Tercera Fase (cuartos), Cuarta (semis) y Final ----------
export function terceraFase(sf, seed) {
  const r = rng(seed);
  const eq = (zona, pos) => ({ ...sf[zona][pos - 1], etiqueta: `${pos}.º ${zona}`, pos, zonaSF: zona });
  const cruces = [
    [eq('A', 1), eq('B', 4)],
    [eq('A', 2), eq('B', 3)],
    [eq('B', 1), eq('A', 4)],
    [eq('B', 2), eq('A', 3)],
  ];
  // Series de ida y vuelta: 1.º puntos, 2.º diferencia de gol; si sigue igual pasa el 1.º/2.º de zona.
  return cruces.map(([mejor, peor], i) => {
    const ida = [Math.floor(r() * 3), Math.floor(r() * 3)]; // local: peor ubicado
    const vuelta = [Math.floor(r() * 3), Math.floor(r() * 3)]; // local: mejor ubicado
    const gMejor = ida[1] + vuelta[0], gPeor = ida[0] + vuelta[1];
    const ptsMejor = (ida[1] > ida[0] ? 3 : ida[1] === ida[0] ? 1 : 0) + (vuelta[0] > vuelta[1] ? 3 : vuelta[0] === vuelta[1] ? 1 : 0);
    const ptsPeor = (ida[0] > ida[1] ? 3 : ida[1] === ida[0] ? 1 : 0) + (vuelta[1] > vuelta[0] ? 3 : vuelta[0] === vuelta[1] ? 1 : 0);
    let ganaMejor;
    let criterio;
    if (ptsMejor !== ptsPeor) { ganaMejor = ptsMejor > ptsPeor; criterio = 'por puntos'; }
    else if (gMejor !== gPeor) { ganaMejor = gMejor > gPeor; criterio = 'por diferencia de gol'; }
    else { ganaMejor = true; criterio = 'por mejor ubicación en la Segunda Fase'; }
    return {
      n: i + 1, mejor, peor,
      ida: `${peor.nombre} ${ida[0]}–${ida[1]} ${mejor.nombre}`,
      vuelta: `${mejor.nombre} ${vuelta[0]}–${vuelta[1]} ${peor.nombre}`,
      global: `${gMejor}–${gPeor}`,
      ganador: ganaMejor ? mejor : peor,
      perdedor: ganaMejor ? peor : mejor,
      criterio,
    };
  });
}

// ---------- Reválida, Primera Etapa ----------
export function revalidaPrimera(pf, seed) {
  const r = rng(seed);
  const resto = (z, desde) => pf.tablas[z].slice(desde - 1).filter((e, i) => !pf.clasifica(z, desde + i, e)).map((e) => ({ ...e, zonaPF: z }));
  const zonaA = [...resto(1, 6), ...resto(2, 5)];
  const zonaB = [...resto(3, 5), ...resto(4, 5)];
  const jugar = (lista) => lista.map((e) => {
    const et = equipoSimulado(r, e.id, e.nombre, lista.length - 1, r());
    return { ...et, zonaPF: e.zonaPF, ptsPF: e.pts, pjPF: e.pj };
  });
  const A = ordenar(jugar(zonaA));
  const B = ordenar(jugar(zonaB));
  // Descenso: zona A por promedio (PF + 1.ª etapa), zona B por puntos (PF + 1.ª etapa).
  const promA = A.map((e) => ({ ...e, clave: (e.ptsPF + e.pts) / (e.pjPF + e.pj) })).sort((a, b) => a.clave - b.clave);
  const ptsB = B.map((e) => ({ ...e, clave: e.ptsPF + e.pts })).sort((a, b) => a.clave - b.clave);
  const descienden = new Set([...promA.slice(0, 2), ...ptsB.slice(0, 2)].map((e) => e.id));
  // Clasifican 1.º a 5.º de cada zona, salteando a los que descienden.
  const top5 = (t) => t.filter((e) => !descienden.has(e.id)).slice(0, 5).map((e) => e.id);
  const pasan = new Set([...top5(A), ...top5(B)]);
  return { A, B, descienden, pasan, promA, ptsB };
}

// ---------- Reválida, Segunda Etapa: 24 equipos, 1.º vs 24.º ----------
export function revalidaSegunda(sf, cuartos, r1) {
  const posEnSF = (e) => (sf.A.findIndex((x) => x.id === e.id) + 1) || (sf.B.findIndex((x) => x.id === e.id) + 1);
  const perdedores = cuartos.map((c) => c.perdedor).sort((a, b) => posEnSF(a) - posEnSF(b) || orden(a, b))
    .map((e) => ({ ...e, motivo: 'Perdió en cuartos' }));
  const deSF = [];
  for (let p = 5; p <= 9; p++) {
    [sf.A[p - 1], sf.B[p - 1]].sort(orden).forEach((e) => deSF.push({ ...e, motivo: `${p}.º Segunda Fase` }));
  }
  const deR1 = [];
  for (let p = 1; p <= 5; p++) {
    const cand = ['A', 'B'].map((z) => r1[z].filter((e) => r1.pasan.has(e.id))[p - 1]).filter(Boolean)
      .sort((a, b) => b.pts / b.pj - a.pts / a.pj);
    cand.forEach((e) => deR1.push({ ...e, motivo: `${p}.º Reválida 1.ª etapa` }));
  }
  const siembra = [...perdedores, ...deSF, ...deR1].map((e, i) => ({ ...e, semilla: i + 1 }));
  const cruces = [];
  for (let i = 0; i < siembra.length / 2; i++) cruces.push([siembra[i], siembra[siembra.length - 1 - i]]);
  return { siembra, cruces };
}

// ---------- Todo junto ----------
export function federalCompleto(D) {
  const pf = primeraFase(D.zonas);
  const sf = segundaFase(pf, D.seed);
  const cuartos = terceraFase(sf, D.seed + 1);
  const r1 = revalidaPrimera(pf, D.seed + 2);
  const r2 = revalidaSegunda(sf, cuartos, r1);
  return { pf, sf, cuartos, r1, r2 };
}

// ---------- ¿Dónde está cada equipo? ----------
export function recorrido(F, id) {
  const pasos = [];
  let zonaPF, posPF;
  for (const z of [1, 2, 3, 4]) {
    const i = F.pf.tablas[z].findIndex((e) => e.id === id);
    if (i >= 0) { zonaPF = z; posPF = i + 1; }
  }
  const e0 = F.pf.tablas[zonaPF][posPF - 1];
  const clasifico = F.pf.clasifica(zonaPF, posPF, e0);
  pasos.push({ fase: 'Primera Fase', texto: `${posPF}.º de la Zona ${zonaPF}`, tipo: clasifico ? 'ok' : 'baja' });

  if (clasifico) {
    const z = F.sf.A.some((e) => e.id === id) ? 'A' : 'B';
    const pos = F.sf[z].findIndex((e) => e.id === id) + 1;
    pasos.push({ fase: `Segunda Fase · Zona ${z}`, texto: `${pos}.º`, tipo: pos <= 4 ? 'ok' : 'baja' });
    if (pos <= 4) {
      const c = F.cuartos.find((s) => s.mejor.id === id || s.peor.id === id);
      const rival = c.mejor.id === id ? c.peor : c.mejor;
      const gano = c.ganador.id === id;
      pasos.push({ fase: 'Cuartos de final', texto: `${gano ? 'Le ganó' : 'Perdió'} la serie con ${rival.nombre} (${c.criterio})`, tipo: gano ? 'ok' : 'baja' });
      if (gano) { pasos.push({ fase: 'Semifinal', texto: 'Por jugar · sigue en carrera por el 1.er ascenso', tipo: 'actual' }); return pasos; }
    }
    const s = F.r2.siembra.find((e) => e.id === id);
    const cr = F.r2.cruces.find(([a, b]) => a.id === id || b.id === id);
    const rival = cr[0].id === id ? cr[1] : cr[0];
    pasos.push({ fase: 'Reválida · 2.ª etapa', texto: `Cabeza n.º ${s.semilla} · por jugar contra ${rival.nombre}`, tipo: 'actual' });
    return pasos;
  }

  const z = F.r1.A.some((e) => e.id === id) ? 'A' : 'B';
  const pos = F.r1[z].findIndex((e) => e.id === id) + 1;
  if (F.r1.descienden.has(id)) {
    pasos.push({ fase: `Reválida 1.ª etapa · Zona ${z}`, texto: `${pos}.º · ${z === 'A' ? 'peor promedio' : 'menos puntos'} de la zona`, tipo: 'baja' });
    pasos.push({ fase: 'Descenso', texto: 'Desciende al Regional Amateur 2027', tipo: 'desc' });
    return pasos;
  }
  if (!F.r1.pasan.has(id)) {
    pasos.push({ fase: `Reválida 1.ª etapa · Zona ${z}`, texto: `${pos}.º · quedó afuera`, tipo: 'baja' });
    pasos.push({ fase: 'Temporada terminada', texto: 'Mantiene la categoría', tipo: 'fin' });
    return pasos;
  }
  pasos.push({ fase: `Reválida 1.ª etapa · Zona ${z}`, texto: `${pos}.º`, tipo: 'ok' });
  const s = F.r2.siembra.find((e) => e.id === id);
  const cr = F.r2.cruces.find(([a, b]) => a.id === id || b.id === id);
  const rival = cr[0].id === id ? cr[1] : cr[0];
  pasos.push({ fase: 'Reválida · 2.ª etapa', texto: `Cabeza n.º ${s.semilla} · por jugar contra ${rival.nombre}`, tipo: 'actual' });
  return pasos;
}
