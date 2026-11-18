// Dibujo del juego de penales: cancha, tribuna, jugadores, pelota y controles de remate.
import { urlEscudo } from '../lib/escudos.js';
import { ARCO, ARCO_CX } from './penales-logica.js';

/* ---------- Geometría (unidades lógicas del canvas, 800 × 600) ---------- */
export const W = 800, H = 600, ESC = 2;
export const PISO_TRIBUNA = 190;            // donde termina la tribuna y empieza el pasto
export const PELOTA0 = { x: 407, y: 433 };
export const PATEADOR0 = { x: 300, y: 470, s: 1.25 };
export const PATEADOR1 = { x: 393, y: 388, s: 1.1 };
export const ARQUERO0 = { x: ARCO_CX, y: 226 };
export const CONTROLES = [{ x: 232 }, { x: 421 }, { x: 601 }];
export const PERIODO = [1500, 1250, 1050];  // ms que tarda cada indicador en ir y volver

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const suave = (t) => 1 - (1 - t) ** 3;
export const onda = (t) => { const u = ((t % 1) + 1) % 1; return u < 0.5 ? u * 2 : 2 - u * 2; }; // 0→1→0
export const azar = (semilla) => { let s = semilla; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };

export function oscurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(clamp(v * f, 0, 255)).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}
export function distanciaColor(a, b) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255));
}
// Buzo de arquero: el primer color que no se confunda con ninguna de las dos camisetas.
export function kitArquero(propio, otro) {
  const c = ['#f0d020', '#2fb463', '#ff7a1a', '#8f8f95'].find((x) => distanciaColor(x, propio.c1) > 200 && distanciaColor(x, otro.c1) > 200) ?? '#8f8f95';
  return { c1: c, c2: c, patron: 'liso', pant: oscurecer(c, 0.55), medias: c, guantes: true };
}

// Fondo CSS que imita la camiseta, para cuando no hay imagen del escudo.
export function cssCamiseta(e) {
  switch (e.patron) {
    case 'rayas': return `repeating-linear-gradient(90deg, ${e.c1} 0 22%, ${e.c2} 22% 44%)`;
    case 'banda': return `linear-gradient(180deg, ${e.c1} 0 36%, ${e.c2} 36% 62%, ${e.c1} 62%)`;
    case 'franja': return `linear-gradient(135deg, ${e.c1} 0 40%, ${e.c2} 40% 60%, ${e.c1} 60%)`;
    case 'mitades': return `linear-gradient(90deg, ${e.c1} 0 50%, ${e.c2} 50%)`;
    case 'v': return `conic-gradient(from 150deg at 50% 78%, ${e.c2} 0 60deg, ${e.c1} 0)`;
    default: return e.c1;
  }
}
export function escudoHtml(e, clase = '') {
  const u = urlEscudo(e.id);
  return u ? `<img class="pen__escudo ${clase}" src="${u}" alt="" width="40" height="40" decoding="async">`
    : `<span class="pen__escudo pen__escudo--tela ${clase}" style="background:${cssCamiseta(e)}" aria-hidden="true"></span>`;
}

/* ---------- Dibujo de jugadores ---------- */
export function camiseta(ctx, kit, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.clip();
  ctx.fillStyle = kit.c1;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = kit.c2;
  if (kit.patron === 'rayas') for (let i = 0; i < 3; i++) ctx.fillRect(x + w * (0.14 + i * 0.29), y, w * 0.145, h);
  else if (kit.patron === 'banda') ctx.fillRect(x, y + h * 0.3, w, h * 0.22);
  else if (kit.patron === 'mitades') ctx.fillRect(x + w / 2, y, w / 2, h);
  else if (kit.patron === 'franja') { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.3, y); ctx.lineTo(x + w, y + h * 0.8); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.7, y + h); ctx.lineTo(x, y + h * 0.2); ctx.fill(); }
  else if (kit.patron === 'v') { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.22, y); ctx.lineTo(x + w / 2, y + h * 0.5); ctx.lineTo(x + w * 0.78, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w / 2, y + h * 0.78); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(x + w * 0.72, y, w * 0.28, h); // sombra lateral
  ctx.restore();
}

export const PIEL = '#e0ac84', PELO = '#2a1c14';
// o: { x, y (cadera), s, rot, kit, espalda, brazos (0 abajo – 1 arriba), paso (-1..1), patada (0..1), agachado (0..1) }
export function figura(ctx, o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot || 0);
  ctx.scale(o.s, o.s);
  const ag = (o.agachado || 0) * 8;
  const paso = o.paso || 0;

  // Piernas
  [[-5, Math.max(0, paso)], [5, Math.max(0, -paso)]].forEach(([dx, sube], i) => {
    const pat = i === 1 ? (o.patada || 0) : 0;
    const pieX = dx * 1.2 + (i === 1 ? pat * 9 : 0);
    const pieY = 40 - ag - sube * 11 - pat * 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = PIEL; ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(dx, 6); ctx.lineTo(lerp(dx, pieX, 0.55), lerp(6, pieY, 0.55)); ctx.stroke();
    ctx.strokeStyle = o.kit.medias; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(lerp(dx, pieX, 0.55), lerp(6, pieY, 0.55)); ctx.lineTo(pieX, pieY - 2); ctx.stroke();
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.ellipse(pieX + (o.espalda ? 0 : dx * 0.15), pieY + 1, 4.6, 3, 0, 0, 7); ctx.fill();
  });
  // Pantalón
  ctx.fillStyle = o.kit.pant;
  ctx.beginPath(); ctx.roundRect(-11.5, -4 - ag * 0.3, 23, 17, 3); ctx.fill();

  // Brazos
  const b = o.brazos ?? 0.1;
  const ang = lerp(0.3, 2.85, b); // desde casi colgando hasta arriba
  [-1, 1].forEach((lado) => {
    const hx = lado * 11, hy = -28 - ag;
    const mx = hx + lado * Math.sin(ang) * 25, my = hy + Math.cos(ang) * 25;
    ctx.lineCap = 'round';
    ctx.strokeStyle = PIEL; ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = o.kit.guantes ? o.kit.c1 : oscurecer(o.kit.c1, 0.92); ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(lerp(hx, mx, o.kit.guantes ? 0.8 : 0.42), lerp(hy, my, o.kit.guantes ? 0.8 : 0.42)); ctx.stroke();
    ctx.fillStyle = o.kit.guantes ? '#fafafa' : PIEL;
    ctx.beginPath(); ctx.arc(mx, my, o.kit.guantes ? 4.4 : 3.2, 0, 7); ctx.fill();
  });

  // Torso y cabeza
  camiseta(ctx, o.kit, -12, -33 - ag, 24, 32);
  ctx.fillStyle = PIEL;
  ctx.fillRect(-3, -37 - ag, 6, 6);
  ctx.beginPath(); ctx.arc(0, -42 - ag, 7.6, 0, 7); ctx.fill();
  ctx.fillStyle = PELO;
  ctx.beginPath();
  if (o.espalda) ctx.arc(0, -43 - ag, 7.9, Math.PI * 0.92, Math.PI * 2.08);
  else ctx.arc(0, -43.5 - ag, 7.8, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (o.espalda) { ctx.beginPath(); ctx.roundRect(-7.4, -45 - ag, 14.8, 7, 3); ctx.fill(); }
  ctx.restore();
}

/* ---------- Cuerpo articulado ---------- */
// j: articulaciones en metros (penales-cuerpo.js) · P: función que lleva un punto del cuerpo a la pantalla
// s: píxeles por metro a esa profundidad · o: { espalda, guantes }
export function cuerpoDibujo(ctx, j, P, s, kit, o = {}) {
  const q = {};
  for (const k in j) q[k] = P(j[k]);
  const linea = (a, b, ancho, color) => { ctx.strokeStyle = color; ctx.lineWidth = ancho * s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
  const medio = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // Piernas: muslo (piel y pantalón), media y botín
  for (const l of ['L', 'R']) {
    const cad = q[`cad${l}`], rod = q[`rodilla${l}`], pie = q[`pie${l}`];
    linea(cad, rod, 0.135, PIEL);
    linea(rod, pie, 0.105, kit.medias);
    linea(cad, medio(cad, rod, 0.52), 0.175, kit.pant);
    const dx = pie.x - rod.x, dy = pie.y - rod.y, d = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.ellipse(pie.x + (dx / d) * 0.02 * s, pie.y + (dy / d) * 0.02 * s + 0.01 * s, 0.085 * s, 0.055 * s, Math.atan2(dy, dx) + Math.PI / 2, 0, 7); ctx.fill();
  }
  linea(q.cadL, q.cadR, 0.2, kit.pant);
  // Torso: la camiseta gira con el cuerpo
  const ang = Math.atan2(q.pecho.x - q.cadera.x, -(q.pecho.y - q.cadera.y));
  const largo = Math.hypot(q.pecho.x - q.cadera.x, q.pecho.y - q.cadera.y);
  ctx.save();
  ctx.translate(q.cadera.x, q.cadera.y); ctx.rotate(ang);
  camiseta(ctx, kit, -0.215 * s, -largo - 0.07 * s, 0.43 * s, largo + 0.1 * s);
  ctx.restore();
  // Cuello y cabeza
  linea(q.pecho, q.cabeza, 0.085, PIEL);
  const r = 0.118 * s, ac = Math.atan2(q.cabeza.x - q.pecho.x, -(q.cabeza.y - q.pecho.y));
  ctx.fillStyle = PIEL; ctx.beginPath(); ctx.arc(q.cabeza.x, q.cabeza.y, r, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(q.cabeza.x, q.cabeza.y); ctx.rotate(ac);
  ctx.fillStyle = PELO; ctx.beginPath();
  if (o.espalda) { ctx.arc(0, -r * 0.08, r * 1.04, Math.PI * 0.9, Math.PI * 2.1); ctx.fill(); ctx.beginPath(); ctx.roundRect(-r * 0.97, -r * 0.35, r * 1.94, r * 0.95, r * 0.4); }
  else ctx.arc(0, -r * 0.2, r * 1.03, Math.PI * 1.03, Math.PI * 1.97);
  ctx.fill(); ctx.restore();
  // Brazos: manga, antebrazo y mano (o guante)
  const manga = o.guantes ? kit.c1 : oscurecer(kit.c1, 0.92);
  for (const l of ['L', 'R']) {
    const h = q[`hombro${l}`], c = q[`codo${l}`], m = q[`mano${l}`];
    linea(c, m, 0.085, o.guantes ? kit.c1 : PIEL);
    linea(h, o.guantes ? c : medio(h, c, 0.62), 0.115, manga);
    ctx.fillStyle = o.guantes ? '#fafafa' : PIEL;
    ctx.beginPath(); ctx.arc(m.x, m.y, (o.guantes ? 0.092 : 0.058) * s, 0, 7); ctx.fill();
    if (o.guantes) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.7; ctx.stroke(); }
  }
  ctx.restore();
}

/* ---------- Escenario ---------- */
// La tribuna se arma una vez en capas y después se anima moviendo esas capas: no se redibuja cada hincha.
// animo: 'neutral' (alienta), 'festejo' (salta y agita) o 'bronca' (se queda quieta, baja las banderas).
export function crearTribuna(local) {
  const ALTO = PISO_TRIBUNA + 12;
  const lienzo = () => { const c = document.createElement('canvas'); c.width = W * ESC; c.height = ALTO * ESC; const x = c.getContext('2d'); x.scale(ESC, ESC); return [c, x]; };
  const r = azar(7919);
  const [fondo, xf] = lienzo();
  const g = xf.createLinearGradient(0, 0, 0, PISO_TRIBUNA);
  g.addColorStop(0, '#0d1420'); g.addColorStop(1, '#1b2434');
  xf.fillStyle = g; xf.fillRect(0, 0, W, ALTO);
  const claro = distanciaColor(local.c1, '#ffffff') < 90 ? local.c2 : local.c1;
  const paleta = [claro, claro, local.c2, '#ffffff', '#d8dde6', '#24324a', '#3b4a63', oscurecer(claro, 0.7)];
  const pieles = ['#e0ac84', '#c98e63', '#f0c6a4', '#9a6a48'];
  const capas = [lienzo(), lienzo(), lienzo()];
  const [brazos, xb] = lienzo();
  xb.lineCap = 'round'; xb.lineWidth = 1.5;
  for (let fila = 0; fila < 21; fila++) {
    const y = 6 + fila * 7, x = capas[fila % 3][1];
    for (let px = -4 + (fila % 2) * 3.5; px < W + 4; px += 7) {
      const jx = px + (r() - 0.5) * 2.4, jy = y + (r() - 0.5) * 2;
      x.fillStyle = paleta[Math.floor(r() * paleta.length)];
      x.beginPath(); x.ellipse(jx, jy + 4.4, 3.3, 3.6, 0, 0, 7); x.fill();
      const piel = pieles[Math.floor(r() * 4)];
      x.fillStyle = piel;
      x.beginPath(); x.arc(jx, jy, 2.2, 0, 7); x.fill();
      if (r() < 0.38) { // brazos en alto: se muestran más o menos según el ánimo
        xb.strokeStyle = piel;
        const ab = 1.5 + r() * 2.5;
        xb.beginPath(); xb.moveTo(jx - 2.6, jy + 2.5); xb.lineTo(jx - 2.6 - ab, jy - 5 - r() * 2); xb.moveTo(jx + 2.6, jy + 2.5); xb.lineTo(jx + 2.6 + ab, jy - 5 - r() * 2); xb.stroke();
      }
    }
  }
  const TRAPOS = [[-10, 30, 150, 52, 22], [150, 118, 285, 30, 20], [640, 96, 810, 78, 26], [420, 44, 600, 40, 15]];
  const BANDERAS = [[92, 86, 0.0], [222, 60, 1.7], [356, 96, 3.1], [540, 70, 4.4], [672, 52, 5.9], [748, 110, 2.4]];
  const trepados = [[26, 122, -0.1], [64, 110, 0.1], [742, 106, -0.08], [776, 124, 0.08]];
  const kitHincha = { ...local, pant: '#27313f', medias: '#27313f' };

  // t: segundos · animo y tAnimo: estado de la hinchada y cuánto hace que cambió
  // La tribuna se compone en un lienzo aparte, cuadro por medio: se mueve lento y así cuesta la mitad.
  const [comp, xc] = lienzo();
  let cuadro = 0;
  function dibujar(destino, t, animo, tAnimo) {
    if (cuadro++ % 2 === 0) componer(xc, t, animo, tAnimo);
    destino.drawImage(comp, 0, 0, W, ALTO);
  }
  function componer(ctx, t, animo, tAnimo) {
    const fest = animo === 'festejo' ? Math.max(0, 1 - tAnimo / 3.2) : 0;
    const bron = animo === 'bronca' ? Math.max(0, 1 - tAnimo / 2.6) : 0;
    ctx.drawImage(fondo, 0, 0, W, ALTO);
    for (let k = 0; k < 3; k++) {
      const aliento = Math.sin(t * 3.1 + k * 2.1) * 0.9 * (1 - bron);
      const salto = -Math.abs(Math.sin(t * 9.5 + k * 1.3)) * 4.6 * fest;
      ctx.drawImage(capas[k][0], 0, aliento + salto + bron * 1.4, W, ALTO);
    }
    const alfa = clamp(0.16 + 0.14 * Math.sin(t * 2.3) + fest - bron * 0.3, 0, 1);
    if (alfa > 0.02) { ctx.globalAlpha = alfa; ctx.drawImage(brazos, 0, -Math.abs(Math.sin(t * 9.5)) * 4 * fest - Math.sin(t * 3.1) * 0.9, W, ALTO); ctx.globalAlpha = 1; }
    // Trapos: tiras largas que ondean apenas
    for (const [x1, y1, x2, y2, alto] of TRAPOS) {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 1 ? '#ffffff' : claro;
        ctx.beginPath();
        for (let n = 0; n <= 8; n++) { const u = n / 8; ctx.lineTo(lerp(x1, x2, u), lerp(y1, y2, u) + (alto / 3) * i + Math.sin(t * 2.2 + u * 5 + x1) * (1.1 + 2 * fest) * Math.sin(u * Math.PI)); }
        for (let n = 8; n >= 0; n--) { const u = n / 8; ctx.lineTo(lerp(x1, x2, u), lerp(y1, y2, u) + (alto / 3) * (i + 1) + Math.sin(t * 2.2 + u * 5 + x1) * (1.1 + 2 * fest) * Math.sin(u * Math.PI)); }
        ctx.fill();
      }
    }
    // Banderas en caña: se agitan más en el festejo y quedan caídas en la bronca
    for (const [bx, by, f] of BANDERAS) {
      const fuerza = 0.42 + 0.75 * fest - 0.34 * bron;
      const a = Math.sin(t * (2.1 + 2.6 * fest) + f) * fuerza - 0.25 + bron * 0.9 * Math.sign(Math.sin(f * 3));
      const px = bx + Math.sin(a) * 34, py = by - Math.cos(a) * 34;
      ctx.strokeStyle = '#c9c2a8'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx, by + 10); ctx.lineTo(px, py); ctx.stroke();
      const nx = Math.cos(a), ny = Math.sin(a), dir = Math.cos(t * (2.1 + 2.6 * fest) + f) >= 0 ? -1 : 1;
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i ? claro : (local.c2 === claro ? '#ffffff' : local.c2);
        ctx.beginPath();
        for (let n = 0; n <= 6; n++) { const u = n / 6, w = Math.sin(t * 7 + u * 4 + f) * 2.2 * u; ctx.lineTo(px + dir * nx * 26 * u - Math.sin(a) * (i * 8) + ny * w, py + dir * ny * 26 * u + Math.cos(a) * (i * 8) + w + u * 3 * (1 + bron * 3)); }
        for (let n = 6; n >= 0; n--) { const u = n / 6, w = Math.sin(t * 7 + u * 4 + f) * 2.2 * u; ctx.lineTo(px + dir * nx * 26 * u - Math.sin(a) * (i * 8 + 8) + ny * w, py + dir * ny * 26 * u + Math.cos(a) * (i * 8 + 8) + w + u * 3 * (1 + bron * 3)); }
        ctx.fill();
      }
    }
  }
  // Hinchas trepados al alambrado: se balancean, saltan en el festejo y se quedan colgados en la bronca
  function dibujarTrepados(ctx, t, animo, tAnimo) {
    const fest = animo === 'festejo' ? Math.max(0, 1 - tAnimo / 3.2) : 0;
    const bron = animo === 'bronca' ? Math.max(0, 1 - tAnimo / 2.6) : 0;
    trepados.forEach(([px, py, rot], i) => figura(ctx, {
      x: px, y: py - Math.abs(Math.sin(t * 8 + i)) * 3 * fest + bron * 1.5, s: 0.62, rot: rot + Math.sin(t * 1.9 + i * 1.7) * 0.05 * (1 - bron),
      kit: kitHincha, espalda: true, brazos: clamp(0.86 + Math.sin(t * (3 + 6 * fest) + i * 2) * (0.07 + 0.1 * fest) - bron * 0.25, 0, 1), paso: 0.5,
    }));
  }
  return { dibujar, dibujarTrepados };
}

export function crearAlambrado() {
  const c = document.createElement('canvas');
  c.width = W * ESC; c.height = (PISO_TRIBUNA + 12) * ESC;
  const x = c.getContext('2d');
  x.scale(ESC, ESC);
  // Malla
  x.strokeStyle = 'rgba(210,220,235,.2)'; x.lineWidth = 0.7;
  x.beginPath();
  for (let i = -160; i < W + 160; i += 9) { x.moveTo(i, 58); x.lineTo(i + 96, 154); x.moveTo(i + 96, 58); x.lineTo(i, 154); }
  x.stroke();
  // Postes y caño superior
  x.fillStyle = '#9aa3ad';
  [118, 300, 508, 700].forEach((px) => x.fillRect(px - 3, 6, 6, 150));
  x.fillStyle = '#b4bcc6'; x.fillRect(0, 56, W, 3);
  // Paredón
  const g = x.createLinearGradient(0, 152, 0, PISO_TRIBUNA);
  g.addColorStop(0, '#8d8f8c'); g.addColorStop(1, '#6f716e');
  x.fillStyle = g; x.fillRect(0, 152, W, PISO_TRIBUNA - 152);
  x.fillStyle = 'rgba(0,0,0,.18)';
  for (let i = 0; i < W; i += 46) x.fillRect(i, 152, 1, PISO_TRIBUNA - 152);
  x.fillStyle = '#2d4a86'; x.fillRect(0, PISO_TRIBUNA - 4, W, 4);
  return c;
}

export function pasto(ctx) {
  const g = ctx.createLinearGradient(0, PISO_TRIBUNA, 0, H);
  g.addColorStop(0, '#3f9a25'); g.addColorStop(1, '#2f8a1c');
  ctx.fillStyle = g; ctx.fillRect(0, PISO_TRIBUNA, W, H - PISO_TRIBUNA);
  // Damero del corte
  const filas = [PISO_TRIBUNA, 262, 306, 356, 414, 482, 560, H];
  for (let f = 0; f < filas.length - 1; f++) {
    for (let col = 0; col < 8; col++) {
      if ((f + col) % 2) continue;
      ctx.fillStyle = 'rgba(255,255,255,.055)';
      ctx.fillRect(col * 100, filas[f], 100, filas[f + 1] - filas[f]);
    }
  }
  // Líneas
  ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 264); ctx.lineTo(W, 264); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, 264); ctx.lineTo(20, 348); ctx.lineTo(780, 348); ctx.lineTo(758, 264); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 527); ctx.lineTo(W, 527); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(400, 527, 350, 62, 0, 0.02, Math.PI - 0.02); ctx.stroke();
}

export function arco(ctx, sacude) {
  const { x1, x2, y1, y2 } = ARCO;
  const fx1 = x1 + 10, fx2 = x2 - 10, fy = y1 - 22; // fondo de la red
  // Red
  ctx.save();
  ctx.fillStyle = 'rgba(20,30,40,.28)';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(fx1, fy); ctx.lineTo(fx2, fy); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, k = Math.sin(t * Math.PI) * sacude;
    ctx.moveTo(lerp(fx1, fx2, t), fy); ctx.lineTo(lerp(x1, x2, t), y1 + k * 0.4); ctx.lineTo(lerp(x1, x2, t) + k, y2);
  }
  for (let j = 0; j <= 11; j++) { const y = lerp(y1, y2, j / 11); ctx.moveTo(x1, y); ctx.lineTo(x2, y); }
  for (let j = 1; j < 3; j++) { const t = j / 3; ctx.moveTo(lerp(x1, fx1, t), lerp(y1, fy, t)); ctx.lineTo(lerp(x2, fx2, t), lerp(y1, fy, t)); }
  ctx.stroke();
  // Tensores
  ctx.strokeStyle = '#8f979f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1 - 4, y1); ctx.lineTo(x1 - 18, fy - 4); ctx.lineTo(x1 - 18, y2 + 4); ctx.moveTo(x2 + 4, y1); ctx.lineTo(x2 + 18, fy - 4); ctx.lineTo(x2 + 18, y2 + 4); ctx.stroke();
  ctx.restore();
}
export function palos(ctx) {
  const { x1, x2, y1, y2 } = ARCO;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x1 - 3, y2 + 2); ctx.lineTo(x1 - 3, y1 - 3); ctx.lineTo(x2 + 3, y1 - 3); ctx.lineTo(x2 + 3, y2 + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

export function pelotaDibujo(ctx, x, y, r, giro = 0, alfa = 1) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(x, y);
  ctx.fillStyle = '#fbfbfb';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.rotate(giro);
  ctx.fillStyle = '#1c1c1f';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, 7); ctx.fill();
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.24, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.restore();
}

/* ---------- Controles de remate (abajo, como en el diseño) ---------- */
export function miniArco(ctx, cx, y, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) { const x = cx - w / 2 + (w / 8) * i; ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
  for (let j = 0; j <= 4; j++) { const yy = y + (h / 4) * j; ctx.moveTo(cx - w / 2, yy); ctx.lineTo(cx + w / 2, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, y + h); ctx.lineTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.lineTo(cx + w / 2, y + h); ctx.stroke();
}
// En pantallas angostas los controles se dibujan más grandes y más separados para que se lean bien.
export function controles(ctx, st, ahora, chico) {
  CONTROLES.forEach((c, i) => {
    const activo = st.activo && st.paso === i;
    const hecho = st.valores[i] !== null;
    ctx.save();
    ctx.translate(chico ? [150, 410, 655][i] : c.x, chico ? 546 : 566);
    const s = (activo ? 1.16 + Math.sin(ahora / 140) * 0.015 : 1) * (chico ? 1.45 : 1);
    ctx.scale(s, s);
    ctx.globalAlpha = activo || hecho ? 1 : 0.42;
    const v = hecho ? st.valores[i] : activo ? st.indicador : 0.5;
    if (activo) { ctx.shadowColor = 'rgba(255,255,255,.75)'; ctx.shadowBlur = 12; }
    if (i === 0) {
      miniArco(ctx, 0, -27, 96, 26);
      ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-58, 5, 116, 10, 5); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      pelotaDibujo(ctx, -58 + v * 116, 10, 9.5);
    } else if (i === 1) {
      miniArco(ctx, 0, -18, 100, 40);
      ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-5, -29, 10, 54, 5); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      pelotaDibujo(ctx, 0, 22 - v * 48, 9.5);
    } else {
      const R = 58, a0 = -Math.PI / 2 - 0.44, a1 = -Math.PI / 2 + 0.44;
      const g = ctx.createRadialGradient(0, 28, 4, 0, 28, R);
      // Colores según el nivel de potencia (ver CONFIG_PENALES.potencia): la zona fuerte y la extrema ocupan más lugar.
      g.addColorStop(0, '#2fb23a'); g.addColorStop(0.26, '#8ccf2c'); g.addColorStop(0.47, '#f2d21b'); g.addColorStop(0.62, '#f08a1c'); g.addColorStop(0.7, '#d92a1c'); g.addColorStop(1, '#b51d12');
      ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.arc(0, 28, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      pelotaDibujo(ctx, 0, 20 - v * 40, 9.5);
    }
    ctx.restore();
  });
}

