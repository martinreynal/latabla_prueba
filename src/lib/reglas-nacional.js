// Reglamento Primera Nacional 2026 (Boletín AFA 6823).
export const REGLAS_NACIONAL = {
  equiposPorZona: 18,
  reducidoDesde: 2,
  reducidoHasta: 8,
  descensosPorZona: 2,
};

const orden = (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
export const ordenarZona = (z) => [...z].sort(orden);

// 'ascenso' (1°), 'reducido' (2° a 8°), 'descenso' (2 últimos) o 'neutro'
export function situacion(pos, total = REGLAS_NACIONAL.equiposPorZona) {
  if (pos === 1) return 'ascenso';
  if (pos >= REGLAS_NACIONAL.reducidoDesde && pos <= REGLAS_NACIONAL.reducidoHasta) return 'reducido';
  if (pos > total - REGLAS_NACIONAL.descensosPorZona) return 'descenso';
  return 'neutro';
}

// Primera fase del Reducido. Local: el mejor posicionado.
// Entre los dos 5°: más puntos, luego diferencia de gol, luego goles a favor.
export function primeraFaseReducido(A, B) {
  const eq = (z, letra, n) => ({ ...z[n - 1], etiqueta: `${n}°${letra}`, pos: n });
  const cruces = [
    [eq(A, 'A', 2), eq(B, 'B', 8)],
    [eq(B, 'B', 2), eq(A, 'A', 8)],
    [eq(A, 'A', 3), eq(B, 'B', 7)],
    [eq(B, 'B', 3), eq(A, 'A', 7)],
    [eq(A, 'A', 4), eq(B, 'B', 6)],
    [eq(B, 'B', 4), eq(A, 'A', 6)],
  ];
  const a5 = eq(A, 'A', 5), b5 = eq(B, 'B', 5);
  cruces.push(orden(a5, b5) <= 0 ? [a5, b5] : [b5, a5]);
  return cruces; // [local, visitante]
}

export function finalPrimerAscenso(A, B) {
  return [{ ...A[0], etiqueta: '1°A' }, { ...B[0], etiqueta: '1°B' }];
}
