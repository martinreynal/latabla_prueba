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

/* ---------- Escenario ---------- */
export function crearTribuna(local) {
  const c = document.createElement('canvas');
  c.width = W * ESC; c.height = (PISO_TRIBUNA + 12) * ESC;
  const x = c.getContext('2d');
  x.scale(ESC, ESC);
  const r = azar(7919);
  const g = x.createLinearGradient(0, 0, 0, PISO_TRIBUNA);
  g.addColorStop(0, '#0d1420'); g.addColorStop(1, '#1b2434');
  x.fillStyle = g; x.fillRect(0, 0, W, PISO_TRIBUNA + 12);
  const claro = distanciaColor(local.c1, '#ffffff') < 90 ? local.c2 : local.c1;
  const paleta = [claro, claro, local.c2, '#ffffff', '#d8dde6', '#24324a', '#3b4a63', oscurecer(claro, 0.7)];
  for (let fila = 0; fila < 21; fila++) {
    const y = 6 + fila * 7;
    for (let px = -4 + (fila % 2) * 3.5; px < W + 4; px += 7) {
      const jx = px + (r() - 0.5) * 2.4, jy = y + (r() - 0.5) * 2;
      x.fillStyle = paleta[Math.floor(r() * paleta.length)];
      x.beginPath(); x.ellipse(jx, jy + 4.4, 3.3, 3.6, 0, 0, 7); x.fill();
      x.fillStyle = ['#e0ac84', '#c98e63', '#f0c6a4', '#9a6a48'][Math.floor(r() * 4)];
      x.beginPath(); x.arc(jx, jy, 2.2, 0, 7); x.fill();
    }
  }
  // Trapos: tiras largas con los colores del equipo
  const trapo = (x1, y1, x2, y2, alto) => {
    for (let i = 0; i < 3; i++) {
      x.fillStyle = i === 1 ? '#ffffff' : claro;
      x.beginPath();
      x.moveTo(x1, y1 + (alto / 3) * i); x.lineTo(x2, y2 + (alto / 3) * i);
      x.lineTo(x2, y2 + (alto / 3) * (i + 1)); x.lineTo(x1, y1 + (alto / 3) * (i + 1));
      x.fill();
    }
  };
  trapo(-10, 30, 150, 52, 22); trapo(150, 118, 285, 30, 20); trapo(640, 96, 810, 78, 26); trapo(420, 44, 600, 40, 15);
  return c;
}

export function crearAlambrado(local) {
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
  // Hinchas trepados al alambrado, con la camiseta del equipo de la tribuna
  if (local) {
    [[26, 122, -0.1], [64, 110, 0.1], [742, 106, -0.08], [776, 124, 0.08]].forEach(([px, py, rot]) =>
      figura(x, { x: px, y: py, s: 0.62, rot, kit: { ...local, pant: '#27313f', medias: '#27313f' }, espalda: true, brazos: 0.93, paso: 0.5 }));
  }
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
    const activo = st.fase === 'apuntar' && st.paso === i;
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
      g.addColorStop(0, '#2fb23a'); g.addColorStop(0.38, '#8ccf2c'); g.addColorStop(0.6, '#f2d21b'); g.addColorStop(0.8, '#f08a1c'); g.addColorStop(1, '#d92a1c');
      ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.arc(0, 28, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      pelotaDibujo(ctx, 0, 20 - v * 40, 9.5);
    }
    ctx.restore();
  });
}

