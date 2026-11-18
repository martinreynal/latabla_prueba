// Cuerpos articulados del penal: esqueleto con jerarquía de articulaciones, poses, interpolación,
// y los "cerebros" de movimiento del arquero y del ejecutante. Unidades en metros. Nada de este archivo dibuja.
//
// Una pose es la posición de la cadera (x, y), la inclinación del cuerpo (th) y los ángulos de cada miembro:
//   aL / aR = [hombro, codo]                    (brazos; ángulos relativos al torso y al brazo)
//   lL / lR = [cadera, rodilla, escMuslo, escPierna]   (piernas; las escalas simulan el escorzo hacia la cámara)
// Los ángulos se miden desde "arriba" del cuerpo, positivos hacia la derecha de la pantalla.

const PI = Math.PI;
export const HUESOS = { torso: 0.52, cuello: 0.2, hombro: 0.19, brazo: 0.3, antebrazo: 0.28, cadera: 0.1, muslo: 0.46, pierna: 0.46 };
const RADIOS = { mano: 0.115, antebrazo: 0.055, brazo: 0.065, torso: 0.19, cabeza: 0.115, muslo: 0.085, pierna: 0.065, pie: 0.085 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const suave = (t) => t * t * (3 - 2 * t);
const frenado = (t) => Math.sin((clamp(t, 0, 1) * PI) / 2);
const arriba = (a) => ({ x: Math.sin(a), y: Math.cos(a) });
const norm = (a) => { while (a > PI) a -= 2 * PI; while (a <= -PI) a += 2 * PI; return a; };

export function pose(o = {}) {
  return { x: 0, y: 0.95, th: 0, cab: 0, aL: [-2.35, 0.6], aR: [2.35, -0.6], lL: [0.2, -0.2, 1, 1], lR: [-0.2, 0.2, 1, 1], ...o };
}
export function mezclar(a, b, t) {
  const arr = (p, q) => p.map((v, i) => lerp(v, q[i], t));
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), th: lerp(a.th, b.th, t), cab: lerp(a.cab, b.cab, t), aL: arr(a.aL, b.aL), aR: arr(a.aR, b.aR), lL: arr(a.lL, b.lL), lR: arr(a.lR, b.lR) };
}
// Ajusta los ángulos de "hasta" para que la interpolación desde "desde" tome siempre el camino corto.
function desenrollar(desde, hasta) {
  const cerca = (ref, v) => ref + norm(v - ref);
  hasta.th = cerca(desde.th, hasta.th);
  for (const k of ['aL', 'aR', 'lL', 'lR']) { hasta[k][0] = cerca(desde[k][0], hasta[k][0]); hasta[k][1] = cerca(desde[k][1], hasta[k][1]); }
  return hasta;
}

/* ---------- Cinemática directa: de la pose a las articulaciones ---------- */
export function articulaciones(p) {
  const H = HUESOS;
  const u = arriba(p.th), izq = { x: -Math.cos(p.th), y: Math.sin(p.th) };
  const cadera = { x: p.x, y: p.y };
  const pecho = { x: cadera.x + u.x * H.torso, y: cadera.y + u.y * H.torso };
  const uc = arriba(p.th + p.cab);
  const cabeza = { x: pecho.x + uc.x * H.cuello, y: pecho.y + uc.y * H.cuello };
  const j = { cadera, pecho, cabeza };
  for (const [lado, sg] of [['L', 1], ['R', -1]]) {
    const hombro = { x: pecho.x + izq.x * H.hombro * sg, y: pecho.y + izq.y * H.hombro * sg };
    const [s, e] = p[`a${lado}`];
    const A = p.th + s, d1 = arriba(A), d2 = arriba(A + e);
    const codo = { x: hombro.x + d1.x * H.brazo, y: hombro.y + d1.y * H.brazo };
    const mano = { x: codo.x + d2.x * H.antebrazo, y: codo.y + d2.y * H.antebrazo };
    const cad = { x: cadera.x + izq.x * H.cadera * sg, y: cadera.y + izq.y * H.cadera * sg };
    const [h, k, em, ep] = p[`l${lado}`];
    const B = p.th + PI + h, e1 = arriba(B), e2 = arriba(B + k);
    const rodilla = { x: cad.x + e1.x * H.muslo * em, y: cad.y + e1.y * H.muslo * em };
    const pie = { x: rodilla.x + e2.x * H.pierna * ep, y: rodilla.y + e2.y * H.pierna * ep };
    Object.assign(j, { [`hombro${lado}`]: hombro, [`codo${lado}`]: codo, [`mano${lado}`]: mano, [`cad${lado}`]: cad, [`rodilla${lado}`]: rodilla, [`pie${lado}`]: pie });
  }
  return j;
}
// Sube o baja la cadera para que el pie más bajo quede apoyado en el piso.
export function apoyar(p) {
  const j = articulaciones(p);
  p.y += 0.06 - Math.min(j.pieL.y, j.pieR.y);
  return p;
}

/* ---------- Cinemática inversa de dos huesos (brazo o pierna hacia un punto) ---------- */
function ik(origen, destino, a, b, flex) {
  const dx = destino.x - origen.x, dy = destino.y - origen.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const A = Math.atan2(dx, dy) + flex * Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const art = { x: origen.x + Math.sin(A) * a, y: origen.y + Math.cos(A) * a };
  return [A, norm(Math.atan2(destino.x - art.x, destino.y - art.y) - A)];
}
function brazoHacia(p, lado, destino) {
  const j = articulaciones(p);
  const [A, e] = ik(j[`hombro${lado}`], destino, HUESOS.brazo, HUESOS.antebrazo, lado === 'L' ? -1 : 1);
  p[`a${lado}`] = [norm(A - p.th), e];
}
function piernaHacia(p, lado, destino) {
  const j = articulaciones(p);
  const [A, k] = ik(j[`cad${lado}`], destino, HUESOS.muslo, HUESOS.pierna, lado === 'L' ? 1 : -1);
  p[`l${lado}`] = [norm(A - p.th - PI), k, 1, 1];
}
// Pierna recta hacia un punto, acortada si hace falta: así se ve una pierna que va hacia la cámara o se aleja.
function piernaEscorzo(p, lado, destino) {
  const c = articulaciones(p)[`cad${lado}`];
  const dx = destino.x - c.x, dy = destino.y - c.y, e = Math.min(1, Math.hypot(dx, dy) / (HUESOS.muslo + HUESOS.pierna));
  return (p[`l${lado}`] = [norm(Math.atan2(dx, dy) - p.th - PI), 0, e, e]);
}

/* ---------- Partes del cuerpo para las colisiones con la pelota ---------- */
// Devuelve segmentos y círculos con su velocidad (a partir de las articulaciones del paso anterior).
export function partes(j, jAnt, dt) {
  const vel = (n) => (jAnt ? { vx: (j[n].x - jAnt[n].x) / dt, vy: (j[n].y - jAnt[n].y) / dt } : { vx: 0, vy: 0 });
  const seg = (tipo, lado, a, b, ref) => ({ tipo, lado, a: j[a], b: b ? j[b] : null, r: RADIOS[tipo], ...vel(ref ?? b ?? a) });
  const l = [
    { ...seg('mano', 'L', 'manoL'), otraMano: j.manoR }, { ...seg('mano', 'R', 'manoR'), otraMano: j.manoL },
    seg('antebrazo', 'L', 'codoL', 'manoL'), seg('antebrazo', 'R', 'codoR', 'manoR'),
    seg('brazo', 'L', 'hombroL', 'codoL'), seg('brazo', 'R', 'hombroR', 'codoR'),
    seg('torso', '', 'cadera', 'pecho', 'pecho'), seg('cabeza', '', 'cabeza'),
    seg('muslo', 'L', 'cadL', 'rodillaL'), seg('muslo', 'R', 'cadR', 'rodillaR'),
    seg('pierna', 'L', 'rodillaL', 'pieL'), seg('pierna', 'R', 'rodillaR', 'pieR'),
    seg('pie', 'L', 'pieL'), seg('pie', 'R', 'pieR'),
  ];
  return l;
}

/* =====================================================================
   ARQUERO
   ===================================================================== */
const LISTO = () => apoyar(pose({ lL: [0.42, -0.42, 0.9, 1], lR: [-0.42, 0.42, 0.9, 1] }));
const ALCANCE = HUESOS.torso + HUESOS.brazo + HUESOS.antebrazo; // de la cadera a las manos con el cuerpo estirado
export const ANTICIPO = 0.32;     // s antes del impacto en que arranca una estirada decidida con tiempo
export const REACCION = 0.07;     // s entre que el usuario elige y el arquero empieza a moverse

// Cuánto tarda en llegar con las manos a un punto: más lejos, más tiempo.
export function duracionEstirada(obj, x0 = 0) {
  const d = Math.hypot(obj.x - x0 - Math.sign(obj.x - x0) * 0.4, obj.y - 1.05);
  return clamp(0.3 + 0.17 * d, 0.34, 1.05);
}

// Cuándo conviene arrancar una estirada decidida con tiempo, en segundos respecto del impacto del remate:
// lo justo para llegar junto con la pelota, pero nunca antes de ANTICIPO ni después de que salió el remate.
export function momentoEstirada(obj, tCruce, x0 = 0) {
  return clamp(tCruce - duracionEstirada(obj, x0) - 0.03, -ANTICIPO, -0.04);
}

// Arma el plan completo de una estirada hacia obj: poses clave y tiempos. variante ∈ [0, 1) cambia detalles.
function planEstirada(desde, obj, variante) {
  const dx = obj.x - desde.x, lado = dx >= 0 ? 1 : -1, lejos = Math.abs(dx) > 1.05;
  const D = duracionEstirada(obj, desde.x);
  const v = (n) => ((variante * (n + 1) * 7.31) % 1); // seudoazar estable por penal
  let ext, tipo, impulso;

  if (lejos) {
    tipo = 'vuelo';
    const alto = clamp(obj.y / 2.72, 0, 1);
    const th = lado * lerp(1.62, 1.02, alto);          // rasante: cuerpo horizontal; arriba: en diagonal
    const unaMano = Math.abs(dx) > 3 || (alto > 0.6 && v(1) < 0.45);
    const L = ALCANCE + (unaMano ? 0.06 : 0);
    const u = arriba(th);
    ext = pose({ th, x: obj.x - u.x * L, y: Math.max(0.3, obj.y - u.y * L), cab: -lado * 0.25 });
    // Brazos extendidos hacia la pelota; con una sola mano, la otra acompaña la caída
    const arr = lado > 0 ? 'L' : 'R', aba = lado > 0 ? 'R' : 'L';
    const px = -u.y * 0.07, py = u.x * 0.07;   // las manos llegan juntas, una a cada lado de la pelota
    brazoHacia(ext, arr, unaMano ? obj : { x: obj.x + px * lado, y: obj.y - py * lado });
    if (unaMano) ext[`a${aba}`] = [lado * lerp(1.2, 1.7, v(2)), lado * 0.5];
    else brazoHacia(ext, aba, { x: obj.x - px * lado, y: Math.max(0.1, obj.y + py * lado) });
    // Piernas: la de abajo empuja y queda casi recta; la de arriba se recoge
    ext[`l${aba}`] = [lado * -0.12, lado * 0.2, 1, 1];
    ext[`l${arr}`] = [lado * lerp(0.35, 0.75, v(3)), lado * -lerp(0.7, 1.3, v(4)), 1, 1];
    impulso = pose({ x: desde.x + lado * 0.28, th: lado * 0.38, aL: [-2.7, 0.5], aR: [2.7, -0.5], lL: [0.5, -0.5, 0.62, 0.95], lR: [-0.5, 0.5, 0.62, 0.95] });
  } else if (obj.y < 0.6) {
    // Remate bajo y cerca del cuerpo: pierna o pie si quedó a un costado, bloqueo agachado si viene al medio
    tipo = 'corta';
    ext = pose({ x: desde.x + dx * 0.35, th: lado * 0.12, lL: [0.5, -0.5, 0.55, 0.9], lR: [-0.5, 0.5, 0.55, 0.9] });
    apoyar(ext);
    if (Math.abs(dx) > 0.38) {
      piernaHacia(ext, lado > 0 ? 'R' : 'L', { x: obj.x, y: Math.max(0.08, obj.y - 0.02) });
      brazoHacia(ext, lado > 0 ? 'R' : 'L', { x: obj.x - lado * 0.1, y: obj.y + 0.42 });
    } else {
      brazoHacia(ext, 'L', { x: obj.x - 0.1, y: obj.y + 0.02 }); brazoHacia(ext, 'R', { x: obj.x + 0.1, y: obj.y + 0.02 });
      ext.lL = [0.16, -0.16, 0.5, 0.95]; ext.lR = [-0.16, 0.16, 0.5, 0.95]; // cierra las piernas
      apoyar(ext);
    }
    impulso = mezclar(desde, desenrollar(desde, ext), 0.3);
  } else if (obj.y < 1.75) {
    // Media altura cerca del cuerpo: paso corto y las dos manos a la pelota
    tipo = 'corta';
    // Si la pelota viene entre la rodilla y la cintura, se agacha para llegar con las manos.
    const agacha = clamp((1.05 - obj.y) / 0.45, 0, 1);
    const pierna = (sg) => [sg * lerp(0.3, 0.5, agacha), -sg * lerp(0.3, 0.5, agacha), lerp(0.95, 0.55, agacha), lerp(1, 0.9, agacha)];
    ext = apoyar(pose({ x: desde.x + dx * lerp(0.55, 0.75, agacha), th: lado * 0.16 * Math.min(1, Math.abs(dx)), lL: pierna(1), lR: pierna(-1) }));
    brazoHacia(ext, 'L', { x: obj.x - 0.09, y: obj.y }); brazoHacia(ext, 'R', { x: obj.x + 0.09, y: obj.y });
    impulso = mezclar(desde, desenrollar(desde, ext), 0.3);
  } else {
    // Alta sobre el cuerpo: salto vertical o apenas en diagonal, con el cuerpo estirado
    tipo = 'salto';
    ext = pose({ x: desde.x + dx * 0.7, th: lado * 0.1 * Math.min(1, Math.abs(dx)), y: clamp(obj.y - ALCANCE + 0.05, 0.98, 1.75), lL: [0.1, 0.25 * v(1), 1, 1], lR: [-0.1, -0.3 * v(2), 1, 1] });
    brazoHacia(ext, 'L', { x: obj.x - 0.08, y: obj.y }); brazoHacia(ext, 'R', { x: obj.x + 0.08, y: obj.y });
    impulso = apoyar(pose({ x: desde.x + dx * 0.25, aL: [-2.8, 0.4], aR: [2.8, -0.4], lL: [0.4, -0.4, 0.58, 0.95], lR: [-0.4, 0.4, 0.58, 0.95] }));
  }
  if (tipo === 'vuelo') apoyar(impulso);
  desenrollar(desde, impulso); desenrollar(impulso, ext);

  // Después del contacto: caída de costado, descanso, rodilla al piso, de pie y vuelta al centro
  const suelo = desenrollar(ext, pose({ th: lado * 1.5, x: ext.x, y: 0.21, cab: -lado * 0.35,
    aL: lado > 0 ? [0.55, 0.7] : [0.12, 0.1], aR: lado > 0 ? [-0.12, -0.1] : [-0.55, -0.7],
    lL: lado > 0 ? [0.55, -1.0, 1, 1] : [0.15, -0.35, 1, 1], lR: lado > 0 ? [-0.15, 0.35, 1, 1] : [-0.55, 1.0, 1, 1] }));
  const rodilla = desenrollar(suelo, apoyar(pose({ th: lado * 0.5, aL: [-2.6, 0.3], aR: [2.6, -0.3], lL: [0.5, -0.9, 0.55, 0.7], lR: [-0.5, 0.9, 0.55, 0.7] })));
  const tImp = Math.min(0.12, D * 0.3);
  const caida = tipo === 'vuelo' ? Math.max(0.28, Math.sqrt((2 * Math.max(0, ext.y - 0.21)) / 9.8)) : 0;
  const tSuelo = D + caida;
  const desliza = tipo === 'vuelo' ? 0.35 + 0.3 * v(5) : 0;
  const xFinal = ext.x + lado * desliza;
  const tLev = tipo === 'vuelo' ? tSuelo + 0.4 : D + (tipo === 'salto' ? 0.42 : 0.5);
  const tPie = tLev + (tipo === 'vuelo' ? 0.75 : 0.35);
  const tFin = tPie + Math.abs(xFinal) / 2.4;
  return { obj, tipo, lado, D, tImp, desde, impulso, ext, suelo, rodilla, caida, tSuelo, desliza, xFinal, tLev, tPie, tFin, arco: tipo === 'vuelo' ? 0.12 + 0.1 * v(6) : 0 };
}

export function crearArquero() {
  return { plan: null, tLanz: 0, inclinacion: 0, variante: Math.random() };
}
// Lanza la estirada (una sola vez). t en segundos.
export function lanzarEstirada(a, obj, t) {
  if (a.plan) return false;
  a.plan = planEstirada(poseArquero(a, t), obj, a.variante);
  a.tLanz = t;
  return true;
}
// Ya en el aire y con la pelota viajando, el arquero acomoda las manos hacia ella, hasta donde le da el brazo.
// No cambia la estirada: solo corrige el último tramo. punto = por dónde va a pasar la pelota.
export function afinarManos(a, punto, t, radio = 0.85) {
  if (!a.plan || a.manos) return;
  const o = a.plan.obj, d = Math.hypot(punto.x - o.x, punto.y - o.y), k = Math.min(1, radio / (d || 1));
  a.manos = { x: o.x + (punto.x - o.x) * k, y: Math.max(0.1, o.y + (punto.y - o.y) * k) };
  a.tManos = t;
}
function conManos(a, p, peso, t) {
  const w = a.manos ? peso * clamp((t - a.tManos) / 0.12, 0, 1) : 0;
  if (w <= 0) return p;
  const q = mezclar(p, p, 0), m = a.manos;
  brazoHacia(q, 'L', { x: m.x - 0.08, y: m.y }); brazoHacia(q, 'R', { x: m.x + 0.08, y: m.y });
  if (a.plan.tipo === 'corta' && m.y < 0.45 && Math.abs(m.x - p.x) > 0.3) piernaHacia(q, m.x > p.x ? 'R' : 'L', { x: m.x, y: Math.max(0.08, m.y - 0.02) });
  return mezclar(p, desenrollar(p, q), w);
}

// ¿Terminó de volver al centro? (para no pasar al penal siguiente con el arquero en el piso)
export const arqueroRecuperado = (a, t) => !a.plan || t - a.tLanz >= a.plan.tFin;

// ¿Ya está de pie otra vez? (alcanza para cambiar de pateador sin cortar la caída)
export const arqueroDePie = (a, t) => !a.plan || t - a.tLanz >= a.plan.tPie;

function caminar(base, x, fase) {
  const f = Math.sin(fase), p = mezclar(base, base, 0);
  p.x = x;
  p.lL = [0.16, -0.1, 1 - 0.2 * Math.max(0, f), 1 - 0.3 * Math.max(0, f)];
  p.lR = [-0.16, 0.1, 1 - 0.2 * Math.max(0, -f), 1 - 0.3 * Math.max(0, -f)];
  apoyar(p);
  p.y += 0.02 * Math.abs(Math.cos(fase));
  return p;
}

export function poseArquero(a, t) {
  const listo = LISTO();
  if (!a.plan) {
    // En espera: rebota sobre las puntas de los pies y, si ya eligió un lado, carga el peso hacia ahí
    const b = Math.sin(t * 5.2);
    listo.y += 0.018 * b;
    listo.x = a.inclinacion * 0.16;
    listo.th = a.inclinacion * 0.09;
    listo.aL[0] += 0.05 * b; listo.aR[0] -= 0.05 * b;
    return listo;
  }
  const P = a.plan, tau = t - a.tLanz;
  if (tau < P.tImp) return mezclar(P.desde, P.impulso, suave(tau / P.tImp));                 // impulso
  if (tau < P.D) {                                                                            // vuelo hacia la pelota
    const u = (tau - P.tImp) / (P.D - P.tImp), p = mezclar(P.impulso, P.ext, frenado(u));
    p.y += P.arco * Math.sin(PI * u);
    return conManos(a, p, suave(u), t);
  }
  if (P.tipo !== 'vuelo') {                                                                   // salvadas cortas y saltos
    if (tau < P.tLev) { const p = mezclar(P.ext, P.ext, 0); if (P.tipo === 'salto') p.y = Math.max(LISTO().y, P.ext.y - 4.9 * (tau - P.D) ** 2); return conManos(a, p, 1, t); }
    let base = mezclar(P.ext, P.ext, 0); if (P.tipo === 'salto') base.y = Math.max(listo.y, P.ext.y - 4.9 * (P.tLev - P.D) ** 2);
    base = conManos(a, base, 1, t);
    const enPie = { ...listo, x: P.ext.x };
    if (tau < P.tPie) return mezclar(base, enPie, suave((tau - P.tLev) / (P.tPie - P.tLev)));
    if (tau < P.tFin) { const u = (tau - P.tPie) / (P.tFin - P.tPie); return caminar(listo, lerp(P.xFinal, 0, suave(u)), tau * 9); }
    return listo;
  }
  if (tau < P.tLev) {                                                                         // caída y descanso en el piso
    const v = tau - P.D, p = mezclar(P.ext, P.suelo, suave(clamp((v - 0.07) / Math.max(P.caida, 0.3), 0, 1)));
    p.y = Math.max(0.21, P.ext.y - 4.9 * v * v);
    p.x = P.ext.x + P.lado * P.desliza * (1 - Math.exp(-4 * v));
    return conManos(a, p, 1 - clamp((v - 0.1) / 0.25, 0, 1), t);
  }
  const enSuelo = { ...P.suelo, x: P.xFinal, y: 0.21 };
  if (tau < P.tPie) {                                                                         // se incorpora: rodilla y de pie
    const u = (tau - P.tLev) / (P.tPie - P.tLev);
    const rod = { ...P.rodilla, x: P.xFinal - P.lado * 0.1 }, pie = { ...desenrollar(rod, LISTO()), x: P.xFinal - P.lado * 0.15 };
    return u < 0.55 ? mezclar(enSuelo, rod, suave(u / 0.55)) : mezclar(rod, pie, suave((u - 0.55) / 0.45));
  }
  if (tau < P.tFin) { const u = (tau - P.tPie) / (P.tFin - P.tPie); return caminar(listo, lerp(P.xFinal - P.lado * 0.15, 0, suave(u)), tau * 9); }
  return listo;
}

/* =====================================================================
   EJECUTANTE (visto de espaldas)
   ===================================================================== */
// Punto de la pelota en el plano del ejecutante (la pelota queda "más arriba" en pantalla porque está más lejos).
const PELOTA_EN_PLANO = { x: 0.0, y: 0.2 };
const APOYO = { x: -0.26, y: 0.06 };          // pie de apoyo, al costado de la pelota

// Cada carrera es distinta: cantidad de pasos, velocidad, inclinación y, a veces, un freno antes de pegarle.
export function crearCarrera(rnd = Math.random) {
  const pasos = 3 + Math.floor(rnd() * 3);
  return {
    pasos, duracion: 0.72 + 0.11 * pasos * (0.75 + rnd() * 0.5), freno: rnd() < 0.14,
    inicio: { x: -1.2 - rnd() * 0.6, z: -1.25 - 0.2 * pasos }, llegada: { x: -0.15, z: -0.26 },
    inclin: 0.04 + rnd() * 0.07, brazos: 0.35 + rnd() * 0.35, golpe: 0.2 + rnd() * 0.06,
  };
}

// tau: segundos desde que arranca la carrera (negativo = todavía esperando). El impacto es en tau = c.duracion.
// animo: null mientras mira la pelota; 'festeja' o 'lamenta' después del resultado.
export function poseEjecutante(c, tau, animo, tAnimo = 0) {
  const T = c.duracion, tk = c.golpe;
  let u = clamp(tau / T, 0, 1);
  if (c.freno) u = u < 0.5 ? u * 1.25 : 0.625 + (u - 0.5) * 0.75;   // llega rápido, frena y le pega
  const av = u ** 1.2;
  const x = lerp(c.inicio.x, c.llegada.x, av), z = lerp(c.inicio.z, c.llegada.z, av);
  let p;

  if (tau <= 0) {                                                    // parado, esperando
    p = apoyar(pose({ x, aL: [-2.95, 0.15], aR: [2.95, -0.15], lL: [0.1, -0.1, 1, 1], lR: [-0.1, 0.1, 1, 1] }));
    p.y += 0.008 * Math.sin(tau * 3);
  } else if (tau < T - tk) {                                         // carrera
    const fase = PI * c.pasos * av, f = Math.sin(fase);
    const pierna = (sg, g) => [sg * 0.08, sg * -0.05, 1 - 0.3 * Math.abs(g), 1 - (g > 0 ? 0.5 : 0.12) * Math.abs(g)];
    p = pose({ x, th: c.inclin, cab: -0.05, lL: pierna(1, f), lR: pierna(-1, -f),
      aL: [-2.8 + c.brazos * 0.5 * Math.max(0, -f), 0.5 + c.brazos * f], aR: [2.8 - c.brazos * 0.5 * Math.max(0, f), -0.5 + c.brazos * f] });
    apoyar(p);
    p.y += 0.035 * Math.abs(Math.cos(fase));
  } else {
    // Golpe: el pie de apoyo queda firme al lado de la pelota; la pierna ejecutora va atrás y entra a la pelota.
    const g = (tau - (T - tk)) / tk;                                 // 0 = empieza el golpe · 1 = impacto
    const seg = clamp((tau - T) / 0.28, 0, 1);                       // seguimiento después del impacto
    p = pose({ x, y: 0.9 - 0.05 * Math.sin(PI * clamp(g, 0, 1)), th: lerp(c.inclin, -0.1, clamp(g, 0, 1)) - 0.06 * seg, cab: 0.05 });
    piernaEscorzo(p, 'L', APOYO);
    // Pierna ejecutora: arranca apoyada, se recoge hacia atrás (de espaldas se ve la pierna plegada),
    // entra a la pelota justo en el impacto y sigue de largo hacia adelante.
    const apoyada = [...piernaEscorzo(p, 'R', { x: p.x + 0.12, y: 0.06 })];
    const recogida = [-0.12, 2.5, 0.92, 0.42];
    const contacto = [...piernaEscorzo(p, 'R', { x: PELOTA_EN_PLANO.x - 0.03, y: PELOTA_EN_PLANO.y - 0.07 })];
    const larga = [...piernaEscorzo(p, 'R', { x: PELOTA_EN_PLANO.x - 0.04, y: 0.58 })];
    const entre = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
    p.lR = g < 0.5 ? entre(apoyada, recogida, suave(g / 0.5)) : g <= 1 ? entre(recogida, contacto, ((g - 0.5) / 0.5) ** 2) : entre(contacto, larga, frenado(seg));
    p.aL = [-1.75 - 0.3 * Math.sin(PI * clamp(g, 0, 1)), 0.25]; p.aR = [2.5, -0.7];   // brazo contrario afuera, para el equilibrio
    if (tau > T + 0.28) {
      // Queda parado mirando la pelota y después reacciona
      const q = clamp((tau - T - 0.28) / 0.35, 0, 1);
      let parado = apoyar(pose({ x: p.x, aL: [-2.9, 0.2], aR: [2.9, -0.2], lL: [0.14, -0.14, 1, 1], lR: [-0.14, 0.14, 1, 1], cab: 0.04 }));
      if (animo === 'festeja') {
        const k = suave(clamp(tAnimo / 0.3, 0, 1)), salto = Math.abs(Math.sin(tAnimo * 7)) * 0.09 * k;
        parado = mezclar(parado, pose({ x: p.x, y: parado.y, aL: [-0.5, -0.25], aR: [0.5, 0.25], lL: [0.12, -0.12, 1, 1], lR: [-0.12, 0.12, 1, 1], cab: -0.05 }), k);
        parado.y += salto;
      } else if (animo === 'lamenta') {
        const k = suave(clamp(tAnimo / 0.45, 0, 1));
        const baja = mezclar(parado, parado, 0); baja.cab = 0.25; baja.th = 0.05;
        const j = articulaciones(baja);
        brazoHacia(baja, 'L', { x: j.cabeza.x - 0.1, y: j.cabeza.y + 0.06 }); brazoHacia(baja, 'R', { x: j.cabeza.x + 0.1, y: j.cabeza.y + 0.06 });
        parado = mezclar(parado, desenrollar(parado, baja), k);
      }
      p = mezclar(desenrollar(parado, p), parado, suave(q));
    }
  }
  return { pose: p, z };
}
