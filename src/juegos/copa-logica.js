// Lógica de la Copa Argentina: sorteo, resultados de los 90', simulación de los demás partidos y avance.
// Sin nada de pantalla. Todo lo que se sortea queda guardado en el estado para no repetirse al recargar.
import { ganador } from './penales-logica.js';
import { generarNomina } from './dorsales.js';

export const RONDAS = ['32avos de final', '16avos de final', 'Octavos de final', 'Cuartos de final', 'Semifinales', 'Final'];
export const VERSION = 1;

function mezclar(lista, rnd) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return l;
}

/* ---------- Probabilidades ---------- */
// Empate ficticio de los 90 minutos: 50 % 0-0, 35 % 1-1, 12 % 2-2, 2,8 % 3-3 y 0,2 % 4-4.
export const DISTRIBUCION_EMPATE = [[0, 0.5], [1, 0.35], [2, 0.12], [3, 0.028], [4, 0.002]];
// Easter egg: Colón de Santa Fe contra Gimnasia y Esgrima La Plata (solo ese Gimnasia) tiene 33 % de terminar 6-6.
const COLON_ID = 'espn-7', GIMNASIA_LP_ID = 'espn-9';
export function empate90(idA, idB, rnd = Math.random) {
  const cruce = [idA, idB];
  if (cruce.includes(COLON_ID) && cruce.includes(GIMNASIA_LP_ID) && rnd() < 0.33) return 6;
  let r = rnd();
  for (const [goles, prob] of DISTRIBUCION_EMPATE) { if (r < prob) return goles; r -= prob; }
  return 0;
}
/* ---------- Sorteo de moneda, elección de ventaja y presión de la tribuna ---------- */
// Todo configurable desde acá.
export const MONEDA = {
  cara: 0.5,                 // probabilidad de que salga cara
  rivalPateaPrimero: 0.983,  // si el rival gana el sorteo: 98,3 % patea primero, 1,7 % elige el lado
  duracion: 2600,            // ms de la animación de la moneda
  avisoRival: 2200,          // ms que se muestra la decisión del rival
};
export const PRESION = {
  quinto: 0.5,                                   // 5.º penal del rival: regla especial
  muerteSubita: [0.15, 0.25, 0.35, 0.45, 0.55],  // 6.º a 10.º penal del rival
  tope: 0.6,                                     // 11.º en adelante
  cursor: 1.3,                                   // velocidad del control de dirección con la tribuna en contra
};

// Sorteo de un partido. La moneda y la decisión que tomaría el rival se sortean acá, una sola vez y por separado,
// antes de que el usuario elija nada: lo que elija no cambia ninguna probabilidad y recargar no lo repite.
export function nuevoSorteo(rnd = Math.random) {
  return {
    coinChoice: null, coinResult: rnd() < MONEDA.cara ? 'cara' : 'cruz',
    rivalElige: rnd() < MONEDA.rivalPateaPrimero ? 'patear' : 'lado',
    tossWinner: null, decision: null, firstKicker: null, crowdTeam: null,
    penaltyNumberByTeam: { yo: 0, rival: 0 }, specialMissProbability: 0, horizontalCursorSpeedMultiplier: 1,
    especiales: {},          // n.º de penal del rival → si falla por arriba (se define una sola vez por ejecución)
    listo: false,            // ya se mostró el resumen y empezó la tanda
  };
}
// Decisión del ganador: 'patear' (patea primero, con la tribuna rival) o 'lado' (su hinchada, patea segundo).
export function aplicarDecision(s, quien, decision) {
  if (s.decision) return s;
  const otro = quien === 'yo' ? 'rival' : 'yo';
  s.decision = decision;
  s.firstKicker = decision === 'patear' ? quien : otro;   // orden de pateadores
  s.crowdTeam = decision === 'patear' ? otro : quien;     // tribuna
  s.horizontalCursorSpeedMultiplier = s.crowdTeam === 'rival' ? PRESION.cursor : 1;
  return s;
}
// El usuario elige cara o cruz. Solo cuenta la primera vez.
export function elegirMoneda(s, eleccion) {
  if (s.coinChoice) return s;
  s.coinChoice = eleccion;
  s.tossWinner = eleccion === s.coinResult ? 'yo' : 'rival';
  if (s.tossWinner === 'rival') aplicarDecision(s, 'rival', s.rivalElige);
  return s;
}
// Probabilidad de que el penal n.º n del rival se vaya por arriba (solo con la tribuna a favor del usuario).
export function probFalloEspecial(n, crowdTeam) {
  if (crowdTeam !== 'yo' || n < 5) return 0;
  if (n === 5) return PRESION.quinto;
  return PRESION.muerteSubita[n - 6] ?? PRESION.tope;
}
// ¿El penal n.º n del rival falla por arriba? Un solo cálculo por ejecución: queda guardado y no se repite.
export function falloEspecial(s, n, rnd = Math.random) {
  const prob = probFalloEspecial(n, s.crowdTeam);
  s.specialMissProbability = prob;
  if (!(n in s.especiales)) s.especiales[n] = prob > 0 && rnd() < prob;
  return s.especiales[n];
}

export function prepararPartido(idYo, idRival, rnd = Math.random) {
  // primero queda sin definir hasta que se resuelve el sorteo de moneda
  return {
    empate: empate90(idYo, idRival, rnd), primero: null, mios: [], suyos: [], sorteo: nuevoSorteo(rnd),
    // Dorsales y orden de pateadores: una sola vez por partido; en el siguiente se arma una nómina nueva.
    nominas: { yo: generarNomina(idYo, rnd), rival: generarNomina(idRival, rnd) },
  };
}

/* ---------- Simulación de los partidos de los demás ---------- */
function poisson(lambda, rnd) {
  const tope = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > tope);
  return k - 1;
}
function tandaSimulada(rnd) {
  const a = [], b = [];
  for (;;) {
    a.push(rnd() < 0.76); if (ganador(a, b)) break;
    b.push(rnd() < 0.76); if (ganador(a, b)) break;
  }
  return [a.filter(Boolean).length, b.filter(Boolean).length];
}
// fuerza(id) devuelve un número entre 0 y 1 según la categoría del club.
export function simularPartido(a, b, fuerza, rnd = Math.random) {
  const dif = fuerza(a) - fuerza(b);
  const ga = poisson(Math.max(0.35, 1.15 + 0.9 * dif), rnd);
  const gb = poisson(Math.max(0.35, 1.15 - 0.9 * dif), rnd);
  if (ga !== gb) return { ga, gb, pen: null, gan: ga > gb ? a : b };
  const pen = tandaSimulada(rnd);
  return { ga, gb, pen, gan: pen[0] > pen[1] ? a : b };
}

/* ---------- Sorteo y estado de la copa ---------- */
// Dos bombos de 32: cada cruce de 32avos enfrenta a uno del bombo 1 con uno del bombo 2.
// El orden de los cruces define el cuadro completo: no se vuelve a sortear en las rondas siguientes.
export function sortear(equipos, rnd = Math.random) {
  const b1 = mezclar(equipos.filter((e) => e.bombo === 1).map((e) => e.id), rnd);
  const b2 = mezclar(equipos.filter((e) => e.bombo === 2).map((e) => e.id), rnd);
  if (b1.length !== 32 || b2.length !== 32) throw new Error('Los bombos tienen que tener 32 equipos cada uno');
  return b1.map((id, i) => (rnd() < 0.5 ? { a: id, b: b2[i] } : { a: b2[i], b: id }));
}

export function partidoDe(copa, id, ronda = copa.ronda) {
  const i = copa.rondas[ronda]?.findIndex((m) => m.a === id || m.b === id) ?? -1;
  return i < 0 ? null : { i, m: copa.rondas[ronda][i] };
}
export const rivalDe = (m, id) => (m.a === id ? m.b : m.a);

export function nuevaCopa(equipoId, equipos, rnd = Math.random) {
  const copa = { v: VERSION, equipo: equipoId, rondas: [sortear(equipos, rnd)], ronda: 0, estado: 'sorteo', eliminadoEn: null, partido: null };
  copa.partido = prepararPartido(equipoId, rivalDe(partidoDe(copa, equipoId).m, equipoId), rnd);
  return copa;
}

function armarSiguiente(ronda) {
  const sig = [];
  for (let i = 0; i < ronda.length; i += 2) sig.push({ a: ronda[i].gan, b: ronda[i + 1].gan });
  return sig;
}
function simularRonda(copa, r, fuerza, rnd) {
  copa.rondas[r].forEach((m) => { if (!m.gan) Object.assign(m, simularPartido(m.a, m.b, fuerza, rnd)); });
  if (r < RONDAS.length - 1 && !copa.rondas[r + 1]) copa.rondas[r + 1] = armarSiguiente(copa.rondas[r]);
}

// Cierra la ronda actual después de la tanda del usuario: registra su resultado, simula el resto de la ronda
// y arma la siguiente. Las rondas futuras no se simulan hasta conocer a los clasificados,
// salvo que el usuario haya quedado eliminado: ahí se completa el torneo para poder consultar el cuadro.
export function cerrarRonda(copa, fuerza, rnd = Math.random) {
  const { m } = partidoDe(copa, copa.equipo);
  const p = copa.partido;
  const gm = p.mios.filter(Boolean).length, gs = p.suyos.filter(Boolean).length;
  const gano = ganador(p.mios, p.suyos) === 'yo';
  const soyA = m.a === copa.equipo;
  Object.assign(m, { ga: p.empate, gb: p.empate, pen: soyA ? [gm, gs] : [gs, gm], gan: gano ? copa.equipo : rivalDe(m, copa.equipo), usuario: true });
  simularRonda(copa, copa.ronda, fuerza, rnd);
  copa.partido = null;
  if (!gano) {
    copa.estado = 'eliminado'; copa.eliminadoEn = copa.ronda;
    for (let r = copa.ronda + 1; r < RONDAS.length; r++) simularRonda(copa, r, fuerza, rnd);
  } else if (copa.ronda === RONDAS.length - 1) {
    copa.estado = 'campeon';
  } else {
    copa.ronda++;
    copa.estado = 'cuadro';
    copa.partido = prepararPartido(copa.equipo, rivalDe(partidoDe(copa, copa.equipo).m, copa.equipo), rnd);
  }
  return copa;
}
export const campeon = (copa) => copa.rondas[RONDAS.length - 1]?.[0]?.gan ?? null;

/* ---------- Guardado en el navegador ---------- */
const CLAVE = 'latabla:copa-argentina';
export function cargarCopa() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return c && c.v === VERSION && Array.isArray(c.rondas) ? c : null;
  } catch { return null; }
}
export function guardarCopa(copa) { try { localStorage.setItem(CLAVE, JSON.stringify(copa)); } catch { /* sin almacenamiento */ } }
export function borrarCopa() { try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } }
