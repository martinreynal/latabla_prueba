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

/* =====================================================================
   Remates y decisiones en coordenadas de cancha (metros), para el motor físico.
   x: 0 en el centro del arco · y: altura. El arco mide ±3,66 de ancho y 2,72 de alto.
   ===================================================================== */
const MA = 3.66, AA = 2.72;
const entre = (rnd, a, b) => a + rnd() * (b - a);

// Remate del usuario a partir de los tres controles. Más potencia = más rápido, más desvío y más arriba.
export function remateUsuario(h, v, p, rnd = Math.random) {
  const sigma = 0.04 + 0.95 * p ** 3;
  const x = h * MARGEN_H * MA + gauss(rnd) * sigma;
  const y = v * MARGEN_V * AA + gauss(rnd) * sigma * 0.7 + 0.45 * p ** 3;
  return { obj: { x, y: Math.max(0.13, y) }, v0: 17 + 14 * p };
}

// Tipos de remate del rival. peso = probabilidad relativa; todo lo demás son rangos [mínimo, máximo].
// x es la distancia al centro (el lado se sortea aparte), v0 la rapidez en m/s y desvio la imprecisión en metros.
export const TIPOS_REMATE = [
  { tipo: 'colocado', peso: 28, x: [2.2, 3.25], y: [0.3, 1.7], v0: [20, 24], desvio: 0.26 },
  { tipo: 'fuerte', peso: 20, x: [1.0, 3.0], y: [0.6, 2.0], v0: [27, 31], desvio: 0.5, sube: 0.25 },
  { tipo: 'angulo', peso: 13, x: [2.8, 3.35], y: [2.0, 2.45], v0: [23, 27], desvio: 0.36 },
  { tipo: 'rasante', peso: 17, x: [1.8, 3.3], y: [0.13, 0.3], v0: [22, 27], desvio: 0.3 },
  { tipo: 'medio', peso: 13, x: [0, 0.7], y: [0.4, 2.1], v0: [22, 29], desvio: 0.3 },
  { tipo: 'picada', peso: 9, x: [0, 0.9], y: [1.0, 1.9], v0: [11.5, 13], desvio: 0.22 },
];
// Decide el remate completo del rival. Se llama una sola vez, al empezar su turno: después no cambia.
export function generarRemateRival(rnd = Math.random, tipos = TIPOS_REMATE) {
  let r = rnd() * tipos.reduce((s, t) => s + t.peso, 0);
  const t = tipos.find((k) => (r -= k.peso) < 0) ?? tipos[0];
  const lado = rnd() < 0.5 ? -1 : 1;
  const x = lado * entre(rnd, ...t.x) + gauss(rnd) * t.desvio;
  const y = Math.max(0.13, entre(rnd, ...t.y) + gauss(rnd) * t.desvio * 0.6 + (t.sube ?? 0) * rnd());
  return { tipo: t.tipo, obj: { x, y }, v0: entre(rnd, ...t.v0) };
}

// Remate que se va claramente por arriba del travesaño (presión de la tribuna). Se decide antes de la carrera.
export function generarRemateAlto(rnd = Math.random) {
  return { tipo: 'alto', obj: { x: (rnd() * 2 - 1) * 2.8, y: entre(rnd, 3.3, 4.4) }, v0: entre(rnd, 27, 31) };
}

// Arquero rival. cruce = { x, y, t }: por dónde y cuándo va a pasar la pelota a su altura.
// A veces se la juega antes del remate (adivina) y a veces espera y reacciona, con menos tiempo para llegar.
// Devuelve { obj, demora }: a dónde se tira y cuántos segundos después del impacto arranca (negativo = antes).
// obj null = se queda parado.
export const ARQUERO_IA = { adivina: 0.55, aciertaLado: 0.62, seQueda: 0.08, reaccion: [0.03, 0.13], error: 0.22, radio: 0.85 };
export function decidirArqueroIA(cruce, rnd = Math.random, cfg = ARQUERO_IA) {
  if (rnd() < cfg.adivina) {
    if (rnd() < cfg.seQueda) return { obj: null, demora: 0, modo: 'parado' };
    const ladoReal = Math.sign(cruce.x) || (rnd() < 0.5 ? -1 : 1);
    const lado = rnd() < cfg.aciertaLado ? ladoReal : -ladoReal;
    const h = rnd();
    const y = h < 0.45 ? entre(rnd, 0.25, 0.6) : h < 0.85 ? entre(rnd, 0.9, 1.5) : entre(rnd, 1.9, 2.4);
    return { obj: { x: lado * entre(rnd, 2.0, 3.1), y }, demora: -entre(rnd, 0.2, 0.3), modo: 'adivina' };
  }
  return {
    obj: { x: cruce.x + gauss(rnd) * cfg.error, y: Math.max(0.15, cruce.y + gauss(rnd) * cfg.error * 0.7) },
    demora: entre(rnd, ...cfg.reaccion), modo: 'reacciona',
  };
}

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
