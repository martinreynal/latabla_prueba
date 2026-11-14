// Reglas y cálculos del juego de penales, sin nada de pantalla (se pueden probar solos).
// Coordenadas en las unidades lógicas del canvas (800 × 600).

export const ARCO = { x1: 233, x2: 582, y1: 132, y2: 262 };
export const ARCO_CX = (ARCO.x1 + ARCO.x2) / 2;
const AW = ARCO.x2 - ARCO.x1;
const AH = ARCO.y2 - ARCO.y1;

// Los controles llegan un poco más allá del arco: apuntar al extremo es arriesgarse a tirarla afuera.
const MARGEN_H = 1.16;
const MARGEN_V = 1.18;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function gauss(rnd) {
  let u = 0;
  for (let i = 0; i < 6; i++) u += rnd();
  return (u - 3) / 0.707; // aprox. normal(0, 1)
}

// Punto al que apunta el jugador: h ∈ [-1, 1] (izquierda–derecha), v ∈ [0, 1] (abajo–arriba).
export function apuntado(h, v) {
  return { x: ARCO_CX + h * MARGEN_H * (AW / 2), y: ARCO.y2 - v * MARGEN_V * AH };
}

// Punto real donde llega la pelota. Cuanta más potencia p ∈ [0, 1], más se desvía y más se levanta.
export function destino(h, v, p, rnd = Math.random) {
  const a = apuntado(h, v);
  const sigma = 2 + 46 * p ** 3;
  const x = a.x + gauss(rnd) * sigma;
  const y = a.y + gauss(rnd) * sigma * 0.7 - 22 * p ** 3;
  return { x, y: Math.min(y, ARCO.y2 - 5) };
}

export function clasificar(pt) {
  const m = 4;
  if (pt.x >= ARCO.x1 + m && pt.x <= ARCO.x2 - m && pt.y >= ARCO.y1 + m) return 'adentro';
  if (pt.x >= ARCO.x1 - 7 && pt.x <= ARCO.x2 + 7 && pt.y >= ARCO.y1 - 7) return 'palo';
  return 'afuera';
}

// Nueve zonas: col 0–2 (izquierda, centro, derecha) y fila 0–2 (baja, media, alta).
export function centroZona(col, fila) {
  return { x: ARCO.x1 + (col + 0.5) * (AW / 3), y: ARCO.y2 - (fila + 0.5) * (AH / 3) };
}
export function zonaDe(pt) {
  return {
    col: clamp(Math.floor((pt.x - ARCO.x1) / (AW / 3)), 0, 2),
    fila: clamp(Math.floor((ARCO.y2 - pt.y) / (AH / 3)), 0, 2),
  };
}

// Probabilidad de que el arquero, tirado a una zona, ataje una pelota que va a pt con potencia p.
// Depende de la cercanía (errar la altura pesa más que errar unos centímetros al costado) y de la potencia.
export function probAtajada(zona, pt, p, ia = false) {
  const c = centroZona(zona.col, zona.fila);
  const d = Math.hypot(pt.x - c.x, (pt.y - c.y) * 1.6);
  // El arquero rival cubre menos: un remate bien puesto contra un palo se le escapa aunque adivine el lado.
  const alcance = ia ? 50 - 18 * p : 70 - 25 * p;
  return clamp((alcance * 1.3 - d) / (alcance * 0.6), 0, 1) * (1 - 0.25 * p);
}

// Arquero rival: a los remates suaves llega a reaccionar; a los fuertes tiene que adivinar.
export function arqueroIA(pt, p, rnd = Math.random) {
  if (rnd() < 0.3 + 0.4 * (1 - p)) return zonaDe(pt);
  return { col: Math.floor(rnd() * 3), fila: Math.floor(rnd() * 3) };
}

// Remate rival: zona al azar entre las nueve, con la misma chance cada una, y potencia variada.
export function remateRival(rnd = Math.random) {
  const col = Math.floor(rnd() * 3);
  const fila = Math.floor(rnd() * 3);
  const p = 0.35 + rnd() * 0.65;
  const c = centroZona(col, fila);
  const ax = c.x + (rnd() * 2 - 1) * 40;
  const ay = c.y + (rnd() * 2 - 1) * 14;
  const sigma = 2 + 46 * p ** 3;
  const x = ax + gauss(rnd) * sigma;
  const y = Math.min(ay + gauss(rnd) * sigma * 0.7 - 22 * p ** 3, ARCO.y2 - 5);
  return { pt: { x, y }, p };
}

export const duracionVuelo = (p) => 820 - 470 * p;

// ¿Terminó la tanda? mios y suyos son listas de true (gol) / false. Devuelve 'yo', 'rival' o null.
export function ganador(mios, suyos) {
  const ga = mios.filter(Boolean).length;
  const gb = suyos.filter(Boolean).length;
  if (mios.length <= 5 && suyos.length <= 5) {
    if (ga > gb + (5 - suyos.length)) return 'yo';
    if (gb > ga + (5 - mios.length)) return 'rival';
    return null;
  }
  if (mios.length === suyos.length && ga !== gb) return ga > gb ? 'yo' : 'rival';
  return null;
}
