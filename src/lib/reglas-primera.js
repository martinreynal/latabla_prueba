// Reglas de la Liga Profesional 2026 (ajustar si cambia el reglamento).
export const REGLAS = {
  clasificanPorZona: 8,     // a octavos
  cuposLibertadores: 3,     // por tabla anual
  cuposSudamericana: 6,     // por tabla anual
};

const porPuntos = (a, b) => b.pts - a.pts || b.dg - a.dg || (b.gf ?? 0) - (a.gf ?? 0);

export function ordenarZona(z) { return [...z].sort(porPuntos); }
export function ordenarAnual(t) { return [...t].sort(porPuntos); }
export function ordenarPromedios(t) {
  return t.map((e) => ({ ...e, prom: e.pts / e.pj })).sort((a, b) => b.prom - a.prom);
}

// Devuelve un mapa id -> { tipo: 'lib' | 'sud' | 'desc-anual' | 'desc-prom', detalle }
export function estadosCopas(anualOrdenada, promOrdenada, porTitulo = []) {
  const estados = {};
  const titulo = new Map(porTitulo.map((t) => [t.id, t.motivo]));
  titulo.forEach((motivo, id) => { estados[id] = { tipo: 'lib', detalle: motivo }; });

  let lib = 0, sud = 0;
  for (const e of anualOrdenada) {
    if (titulo.has(e.id)) continue;
    if (lib < REGLAS.cuposLibertadores) { estados[e.id] = { tipo: 'lib', detalle: 'Por tabla anual' }; lib++; }
    else if (sud < REGLAS.cuposSudamericana) { estados[e.id] = { tipo: 'sud', detalle: 'Por tabla anual' }; sud++; }
    else break;
  }

  const ultimoAnual = anualOrdenada[anualOrdenada.length - 1];
  estados[ultimoAnual.id] = { tipo: 'desc-anual', detalle: 'Último de la tabla anual' };
  // Descenso por promedio: el último que no haya descendido ya por la anual.
  const ultimoProm = [...promOrdenada].reverse().find((e) => e.id !== ultimoAnual.id);
  estados[ultimoProm.id] = { tipo: 'desc-prom', detalle: 'Último en promedios' };
  return estados;
}

// Cruces de octavos según reglamento: 1°A-8°B, 1°B-8°A, 2°A-7°B...
// Ordenados en dos llaves como el cuadro oficial.
export function crucesOctavos(zonaA, zonaB) {
  const A = (n) => ({ ...zonaA[n - 1], etiqueta: `${n}°A` });
  const B = (n) => ({ ...zonaB[n - 1], etiqueta: `${n}°B` });
  return [
    { nombre: 'Llave 1', partidos: [[A(1), B(8)], [B(4), A(5)], [B(2), A(7)], [A(3), B(6)]] },
    { nombre: 'Llave 2', partidos: [[B(1), A(8)], [A(4), B(5)], [A(2), B(7)], [B(3), A(6)]] },
  ];
}
