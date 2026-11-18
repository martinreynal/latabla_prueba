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

// Parámetros configurables del arquero rival, de la potencia y de los eventos especiales.
export const CONFIG_PENALES = {
  goalkeeperCenterProbability: 0.06,     // se queda en el centro (sin estirada lateral)
  goalkeeperLeftProbability: 0.47,
  goalkeeperRightProbability: 0.47,
  centerSaveLearningProbability: 0.94,   // ataja un remate central después de haber atajado uno
  goalkeeperFumbleProbability: 0.0009,   // se le escapa un remate rasante y fuerte que ya tenía
  zonaCentral: 0.33,                     // fracción del ancho del arco que cuenta como "centro"
  // Potencia: el medidor (0 a 1) se convierte en potencia con una curva que agranda la zona fuerte.
  potencia: { curva: 0.7, vMin: 15, vMax: 40, baja: 0.3, media: 0.6, alta: 0.85 },
  // Cuánto se levanta la pelota con mucha potencia: empieza en "subeDesde" y crece con la altura elegida.
  elevacion: { subeDesde: 0.5, base: 0.6, porAltura: 2.6, azar: [0.15, 1.15], desvioV: 0.3 },
  rasante: 0.35,                         // m: altura máxima, al pasar por el arquero, de un remate rasante
};
const C = CONFIG_PENALES;
export const MEDIO_CENTRAL = MA * C.zonaCentral;   // ±1,21 m: el 33 % central del ancho del arco
export const esCentral = (x) => Math.abs(x) < MEDIO_CENTRAL;

// Medidor (0 a 1) → potencia (0 a 1) y su nivel.
export const potenciaDe = (medidor) => Math.max(0, Math.min(1, medidor)) ** C.potencia.curva;
export function nivelPotencia(p) {
  const P = C.potencia;
  return p < P.baja ? 'baja' : p < P.media ? 'media' : p < P.alta ? 'alta' : 'extrema';
}

// Remate del usuario a partir de los tres controles: h ∈ [-1, 1], v ∈ [0, 1] y el medidor de potencia ∈ [0, 1].
// Más potencia = más velocidad y más desvío. Desde potencia alta la pelota tiende a subir, y sube más
// cuanto más alto se apuntó: un remate extremo a media altura o arriba puede irse por encima del travesaño.
export function remateUsuario(h, v, medidor, rnd = Math.random) {
  const p = potenciaDe(medidor), E = C.elevacion;
  const sigma = 0.04 + 0.7 * p ** 3;
  const fuerza = Math.max(0, (p - E.subeDesde) / (1 - E.subeDesde)) ** 2;          // 0 hasta potencia media, 1 al máximo
  const sube = fuerza * (E.base + E.porAltura * v) * entre(rnd, ...E.azar) + Math.abs(gauss(rnd)) * fuerza * E.desvioV;
  const x = h * MARGEN_H * MA + gauss(rnd) * sigma;
  const y = v * MARGEN_V * AA + gauss(rnd) * sigma * 0.6 + sube;
  return { obj: { x, y: Math.max(0.13, y) }, v0: C.potencia.vMin + (C.potencia.vMax - C.potencia.vMin) * p, p, nivel: nivelPotencia(p) };
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

// Panenka: globito suave, picado por debajo, que cae al centro del arco. No es gol seguro:
// si el arquero se queda en el medio, la puede agarrar.
export function generarPanenka(rnd = Math.random) {
  return { tipo: 'panenka', obj: { x: gauss(rnd) * 0.22, y: entre(rnd, 1.15, 1.6) }, angulo: entre(rnd, 0.55, 0.68) };
}

// Remate que se va claramente por arriba del travesaño (presión de la tribuna). Se decide antes de la carrera.
export function generarRemateAlto(rnd = Math.random) {
  return { tipo: 'alto', obj: { x: (rnd() * 2 - 1) * 2.8, y: entre(rnd, 3.3, 4.4) }, v0: entre(rnd, 27, 31) };
}

/* ---------- Arquero rival ---------- */
// cruce = { x, y, t }: por dónde y cuándo va a pasar la pelota a la altura del arquero.
// Devuelve { obj, demora, modo, seguro }: a dónde se tira y cuántos segundos después del impacto arranca
// (negativo = se anticipa). obj null = se queda parado sin moverse. seguro = bloqueo asegurado por el aprendizaje.
export const ARQUERO_IA = { reaccionCentro: [0.05, 0.12], errorCentro: 0.12, radio: 0.85, alcanceCentro: 1.0 };
export function decidirArqueroIA(cruce, { aprendio = false } = {}, rnd = Math.random) {
  // 1. Aprendizaje: si ya atajó un remate al centro, a los remates centrales les tiene la medida.
  //    Un solo sorteo; si no sale (6 %), el penal sigue con la decisión habitual de abajo.
  if (aprendio && esCentral(cruce.x) && cruce.y < AA && rnd() < C.centerSaveLearningProbability) {
    return { obj: { x: cruce.x, y: cruce.y }, demora: -1, modo: 'aprendido', seguro: true };
  }
  // 2. Decisión habitual: 6 % se queda en el centro, 47 % se tira a la izquierda y 47 % a la derecha.
  const r = rnd();
  if (r < C.goalkeeperCenterProbability) {
    // En el centro no se estira hacia un costado, pero si la pelota le pasa cerca, pone el cuerpo, las manos o las piernas.
    if (Math.abs(cruce.x) > ARQUERO_IA.alcanceCentro + 0.2) return { obj: null, demora: 0, modo: 'centro' };
    const A = ARQUERO_IA.alcanceCentro;
    return {
      obj: { x: Math.max(-A, Math.min(A, cruce.x + gauss(rnd) * ARQUERO_IA.errorCentro)), y: Math.max(0.15, cruce.y + gauss(rnd) * ARQUERO_IA.errorCentro) },
      demora: entre(rnd, ...ARQUERO_IA.reaccionCentro), modo: 'centro',
    };
  }
  const lado = r < C.goalkeeperCenterProbability + C.goalkeeperLeftProbability ? -1 : 1;
  const h = rnd();
  const y = h < 0.42 ? entre(rnd, 0.2, 0.6) : h < 0.82 ? entre(rnd, 0.8, 1.6) : entre(rnd, 1.8, 2.4);
  return { obj: { x: lado * entre(rnd, 1.6, 3.1), y }, demora: -1, modo: lado < 0 ? 'izquierda' : 'derecha' };
}

// Activación del aprendizaje: solo una atajada efectiva de un remate que iba al centro.
export const activaAprendizaje = (res, cruceX) => res === 'atajada' && esCentral(cruceX);

// Error excepcional del arquero: solo remates rasantes de potencia alta o extrema que el arquero toca
// con la pelota todavía entre los palos. Se sortea una sola vez por remate, en el primer contacto.
export function elegibleEscurrida(nivel, contacto) {
  return (nivel === 'alta' || nivel === 'extrema') && contacto.y <= C.rasante && Math.abs(contacto.x) < MA - 0.35;
}
export const sorteaEscurrida = (rnd = Math.random) => rnd() < C.goalkeeperFumbleProbability;

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
