// Penales Copa Argentina: elegís tu equipo y jugás una tanda de penales contra un rival.
// Pateás con tres controles consecutivos (dirección, altura, potencia) y atajás adivinando el sector.
import { guardarEstado } from '../lib/progreso.js';
import { urlEscudo } from '../lib/escudos.js';
import { EQUIPOS_PENALES as EQUIPOS } from '../data/penales-equipos.js';
import { ARCO, ARCO_CX, destino, clasificar, centroZona, zonaDe, probAtajada, arqueroIA, remateRival, duracionVuelo, ganador } from './penales-logica.js';

/* ---------- Geometría (unidades lógicas del canvas, 800 × 600) ---------- */
const W = 800, H = 600, ESC = 2;
const PISO_TRIBUNA = 190;            // donde termina la tribuna y empieza el pasto
const PELOTA0 = { x: 407, y: 433 };
const PATEADOR0 = { x: 300, y: 470, s: 1.25 };
const PATEADOR1 = { x: 393, y: 388, s: 1.1 };
const ARQUERO0 = { x: ARCO_CX, y: 226 };
const CONTROLES = [{ x: 232 }, { x: 421 }, { x: 601 }];
const PERIODO = [1500, 1250, 1050];  // ms que tarda cada indicador en ir y volver

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const suave = (t) => 1 - (1 - t) ** 3;
const onda = (t) => { const u = ((t % 1) + 1) % 1; return u < 0.5 ? u * 2 : 2 - u * 2; }; // 0→1→0
const azar = (semilla) => { let s = semilla; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };

function oscurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(clamp(v * f, 0, 255)).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}
function distanciaColor(a, b) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255));
}
// Buzo de arquero: el primer color que no se confunda con ninguna de las dos camisetas.
function kitArquero(propio, otro) {
  const c = ['#f0d020', '#2fb463', '#ff7a1a', '#8f8f95'].find((x) => distanciaColor(x, propio.c1) > 200 && distanciaColor(x, otro.c1) > 200) ?? '#8f8f95';
  return { c1: c, c2: c, patron: 'liso', pant: oscurecer(c, 0.55), medias: c, guantes: true };
}

// Fondo CSS que imita la camiseta, para cuando no hay imagen del escudo.
function cssCamiseta(e) {
  switch (e.patron) {
    case 'rayas': return `repeating-linear-gradient(90deg, ${e.c1} 0 22%, ${e.c2} 22% 44%)`;
    case 'banda': return `linear-gradient(180deg, ${e.c1} 0 36%, ${e.c2} 36% 62%, ${e.c1} 62%)`;
    case 'franja': return `linear-gradient(135deg, ${e.c1} 0 40%, ${e.c2} 40% 60%, ${e.c1} 60%)`;
    case 'mitades': return `linear-gradient(90deg, ${e.c1} 0 50%, ${e.c2} 50%)`;
    case 'v': return `conic-gradient(from 150deg at 50% 78%, ${e.c2} 0 60deg, ${e.c1} 0)`;
    default: return e.c1;
  }
}
function escudoHtml(e, clase = '') {
  const u = urlEscudo(e.id);
  return u ? `<img class="pen__escudo ${clase}" src="${u}" alt="" width="40" height="40" decoding="async">`
    : `<span class="pen__escudo pen__escudo--tela ${clase}" style="background:${cssCamiseta(e)}" aria-hidden="true"></span>`;
}

/* ---------- Dibujo de jugadores ---------- */
function camiseta(ctx, kit, x, y, w, h) {
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

const PIEL = '#e0ac84', PELO = '#2a1c14';
// o: { x, y (cadera), s, rot, kit, espalda, brazos (0 abajo – 1 arriba), paso (-1..1), patada (0..1), agachado (0..1) }
function figura(ctx, o) {
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
function crearTribuna(local) {
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

function crearAlambrado() {
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

function pasto(ctx) {
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

function arco(ctx, sacude) {
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
function palos(ctx) {
  const { x1, x2, y1, y2 } = ARCO;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x1 - 3, y2 + 2); ctx.lineTo(x1 - 3, y1 - 3); ctx.lineTo(x2 + 3, y1 - 3); ctx.lineTo(x2 + 3, y2 + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function pelotaDibujo(ctx, x, y, r, giro = 0, alfa = 1) {
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
function miniArco(ctx, cx, y, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) { const x = cx - w / 2 + (w / 8) * i; ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
  for (let j = 0; j <= 4; j++) { const yy = y + (h / 4) * j; ctx.moveTo(cx - w / 2, yy); ctx.lineTo(cx + w / 2, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, y + h); ctx.lineTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.lineTo(cx + w / 2, y + h); ctx.stroke();
}
// En pantallas angostas los controles se dibujan más grandes y más separados para que se lean bien.
function controles(ctx, st, ahora, chico) {
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

/* ---------- Juego ---------- */
export function montarPenales(raiz) {
  const st = {
    fase: 'elegir',           // elegir · intro · apuntar · atajar · carrera · vuelo · resultado · fin
    yo: null, rival: null, mios: [], suyos: [], turno: 'patear',
    paso: 0, valores: [null, null, null], indicador: 0.5, faseInd: 0,
    t0: 0,                    // inicio de la fase actual
    tiro: null,               // { pt, p, dur, resultado, zona }
    festejo: 0,
  };
  let tribuna = null;
  const alambrado = crearAlambrado();
  let raf = 0, desmontado = false, espera = 0;

  raiz.innerHTML = `
  <div class="pen">
    <div class="pen__elegir" id="pen-elegir">
      <h2 class="pen__elegir-tit">Elegí tu equipo</h2>
      <div class="pen__equipos">
        ${EQUIPOS.map((e) => `<button type="button" class="pen__equipo" data-eq="${e.id}">${escudoHtml(e)}<span>${e.nombre}</span></button>`).join('')}
      </div>
    </div>
    <div class="pen__cancha" id="pen-cancha" hidden>
      <canvas id="pen-canvas" width="${W * ESC}" height="${H * ESC}" role="img" aria-label="Cancha de penales: arco, arquero y pateador"></canvas>
      <div class="pen__tv" id="pen-tv"></div>
      <p class="pen__msg" id="pen-msg" aria-hidden="true"></p>
      <div class="pen__capa" id="pen-capa"></div>
    </div>
    <p class="pen__ayuda" id="pen-ayuda" hidden></p>
    <p class="pen__teclas" id="pen-teclas" hidden>Con teclado: <kbd>Espacio</kbd> frena cada indicador · para atajar, <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> arriba, <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> al medio, <kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd> abajo</p>
    <p class="pen__vivo" id="pen-vivo" role="status" aria-live="polite"></p>
  </div>`;

  const $ = (id) => raiz.querySelector(`#${id}`);
  const cv = $('pen-canvas');
  const ctx = cv.getContext('2d');
  const goles = (l) => l.filter(Boolean).length;

  /* ----- Marcador ----- */
  function marcador() {
    const terminado = st.fase === 'fin';
    const largo = Math.max(st.mios.length, st.suyos.length);
    const base = terminado ? Math.floor(Math.max(largo - 1, 0) / 5) * 5 : Math.floor(st.suyos.length / 5) * 5;
    const casillas = (l) => Array.from({ length: 5 }, (_, i) => {
      const v = l[base + i];
      return `<i class="${v === true ? 'g' : v === false ? 'e' : ''}"></i>`;
    }).join('');
    $('pen-tv').innerHTML = `
      <div class="pen__tv-eq">${escudoHtml(st.yo)}<span class="pen__tv-nombre">${st.yo.corto}</span></div>
      <div class="pen__tv-res"><b>${goles(st.mios)}</b><span>-</span><b>${goles(st.suyos)}</b></div>
      <div class="pen__tv-eq pen__tv-eq--der"><span class="pen__tv-nombre">${st.rival.corto}</span>${escudoHtml(st.rival)}</div>
      <div class="pen__tv-serie" aria-hidden="true">${casillas(st.mios)}</div>
      <div class="pen__tv-ms">${base >= 5 ? 'Muerte súbita' : ''}</div>
      <div class="pen__tv-serie pen__tv-serie--der" aria-hidden="true">${casillas(st.suyos)}</div>`;
  }
  const ayuda = (t) => { $('pen-ayuda').textContent = t; };
  const decir = (t) => { $('pen-vivo').textContent = t; };
  function mensaje(t, clase) {
    const m = $('pen-msg');
    m.textContent = t;
    m.className = `pen__msg ${t ? 'visible' : ''} ${clase || ''}`;
  }
  function capa(html) {
    const c = $('pen-capa');
    c.innerHTML = html;
    c.classList.toggle('visible', !!html);
    c.querySelector('button, a')?.focus({ preventScroll: true });
  }
  const fase = (f) => { st.fase = f; st.t0 = performance.now(); };

  /* ----- Flujo ----- */
  function elegirEquipo(id) {
    st.yo = EQUIPOS.find((e) => e.id === id);
    nuevaTanda();
  }
  function nuevaTanda() {
    const otros = EQUIPOS.filter((e) => e.id !== st.yo.id);
    st.rival = otros[Math.floor(Math.random() * otros.length)];
    st.mios = []; st.suyos = []; st.tiro = null; st.festejo = 0;
    st.kitArqYo = kitArquero(st.yo, st.rival);
    st.kitArqRival = kitArquero(st.rival, st.yo);
    tribuna = crearTribuna(st.yo);
    $('pen-elegir').hidden = true;
    ['pen-cancha', 'pen-ayuda', 'pen-teclas'].forEach((i) => { $(i).hidden = false; });
    marcador(); mensaje(''); ayuda('');
    fase('intro'); st.turno = 'patear';
    capa(`
      <p class="pen__capa-ronda">Copa Argentina · Definición por penales</p>
      <h2 class="pen__capa-tit">${st.yo.nombre}<br><span>vs</span><br>${st.rival.nombre}</h2>
      <p class="pen__capa-txt">Cinco penales por equipo. Empezás pateando: frená la dirección, la altura y la potencia. Después te toca atajar.</p>
      <div class="pen__capa-btns"><button type="button" class="btn-principal" id="pen-jugar">Jugar</button></div>`);
    $('pen-jugar').addEventListener('click', () => { capa(''); turnoPatear(); });
    decir(`${st.yo.nombre} contra ${st.rival.nombre}.`);
  }
  function turnoPatear() {
    st.turno = 'patear'; st.tiro = null;
    st.valores = [null, null, null]; st.paso = 0; st.faseInd = Math.random();
    mensaje('');
    fase('apuntar');
    ayuda('Pateás vos · 1 de 3: tocá para frenar la dirección');
  }
  function turnoAtajar() {
    st.turno = 'atajar'; st.tiro = null; st.zonaElegida = null;
    mensaje('');
    fase('atajar');
    ayuda('Atajás vos · tocá el sector del arco donde te vas a tirar');
    decir('Te toca atajar. Elegí un sector del arco.');
  }

  function valorIndicador(ahora) {
    return onda(st.faseInd + (ahora - st.t0) / PERIODO[st.paso]);
  }
  function frenar() {
    const ahora = performance.now();
    if (st.fase !== 'apuntar' || ahora - st.t0 < 220) return;
    st.valores[st.paso] = valorIndicador(ahora);
    if (st.paso < 2) {
      st.paso++; st.t0 = ahora; st.faseInd = Math.random();
      ayuda(st.paso === 1 ? '2 de 3: tocá para frenar la altura' : '3 de 3: tocá para frenar la potencia');
      return;
    }
    const [h, v, p] = [st.valores[0] * 2 - 1, st.valores[1], st.valores[2]];
    const pt = destino(h, v, p);
    const donde = clasificar(pt);
    const zona = arqueroIA(pt, p);
    let resultado = donde === 'adentro' ? 'gol' : donde;
    if (donde === 'adentro' && Math.random() < probAtajada(zona, pt, p, true)) resultado = 'atajada';
    st.tiro = { pt, p, dur: duracionVuelo(p), resultado, zona, demora: 40 + 110 * p };
    ayuda('');
    fase('carrera');
  }
  function elegirZona(zona) {
    if (st.fase !== 'atajar' || performance.now() - st.t0 < 220) return;
    const { pt, p } = remateRival();
    const donde = clasificar(pt);
    let resultado = donde === 'adentro' ? 'gol' : donde;
    if (donde === 'adentro' && Math.random() < probAtajada(zona, pt, p)) resultado = 'atajada';
    st.tiro = { pt, p, dur: duracionVuelo(p), resultado, zona, demora: 0 };
    ayuda('');
    fase('carrera');
  }

  function llego() {
    const t = st.tiro;
    const pateo = st.turno === 'patear';
    const gol = t.resultado === 'gol';
    (pateo ? st.mios : st.suyos).push(gol);
    const textos = { gol: '¡Gol!', atajada: pateo ? 'Atajó el arquero' : '¡Atajaste!', palo: '¡Palo!', afuera: 'Afuera' };
    const bueno = pateo ? gol : !gol;
    mensaje(textos[t.resultado], bueno ? 'bien' : 'mal');
    if (gol) st.festejo = performance.now();
    marcador();
    decir(`${pateo ? st.yo.nombre : st.rival.nombre}: ${textos[t.resultado].replace(/[¡!]/g, '')}. Van ${goles(st.mios)} a ${goles(st.suyos)}.`);
    fase('resultado');
  }
  function siguiente() {
    const g = ganador(st.mios, st.suyos);
    if (g) return terminar(g);
    if (st.turno === 'patear') turnoAtajar(); else turnoPatear();
  }
  function terminar(g) {
    fase('fin');
    marcador(); mensaje(''); ayuda('');
    const gano = g === 'yo';
    guardarEstado('penales', gano ? 'resuelto' : 'fallado');
    const campeon = gano ? st.yo : st.rival;
    capa(`
      <p class="pen__capa-ronda">${gano ? '¡Ganaste la tanda!' : 'Perdiste la tanda'}</p>
      <div class="pen__capa-ganador">${escudoHtml(campeon, 'pen__escudo--grande')}</div>
      <h2 class="pen__capa-tit">Ganó ${campeon.nombre}</h2>
      <p class="pen__capa-res">${st.yo.corto} ${goles(st.mios)} – ${goles(st.suyos)} ${st.rival.corto}${st.mios.length > 5 ? ' · en muerte súbita' : ''}</p>
      <div class="pen__capa-btns">
        <button type="button" class="btn-principal" id="pen-otra">Volver a jugar</button>
        <button type="button" class="btn-categoria" id="pen-cambiar">Elegir otro equipo</button>
        <a href="/juegos" data-link class="btn-categoria">Menú principal</a>
      </div>`);
    $('pen-otra').addEventListener('click', nuevaTanda);
    $('pen-cambiar').addEventListener('click', () => {
      capa(''); fase('elegir');
      ['pen-cancha', 'pen-ayuda', 'pen-teclas'].forEach((i) => { $(i).hidden = true; });
      $('pen-elegir').hidden = false;
      $('pen-elegir').querySelector(`[data-eq="${st.yo.id}"]`)?.focus();
    });
    decir(`Final. Ganó ${campeon.nombre}, ${goles(st.mios)} a ${goles(st.suyos)}.`);
  }

  /* ----- Posturas ----- */
  function posturaArquero(ahora) {
    const t = st.tiro;
    const base = { x: ARQUERO0.x, y: ARQUERO0.y, rot: 0, brazos: 0.22, agachado: 0.25 + Math.sin(ahora / 260) * 0.08 };
    if (!t || st.fase === 'carrera' || st.fase === 'apuntar' || st.fase === 'atajar') {
      if (st.fase === 'carrera') base.x += Math.sin(ahora / 90) * 3; // se mueve sobre la línea
      return base;
    }
    const desde = st.fase === 'vuelo' ? ahora - st.t0 - t.demora : 1e6;
    const k = suave(clamp(desde / Math.min(t.dur * 0.95, 360), 0, 1));
    const z = centroZona(t.zona.col, t.zona.fila);
    const lado = t.zona.col - 1;
    let fin;
    if (lado === 0) {
      fin = t.zona.fila === 2 ? { x: base.x, y: base.y - 26, rot: 0, brazos: 1, agachado: 0 }
        : t.zona.fila === 1 ? { x: base.x, y: base.y, rot: 0, brazos: 0.5, agachado: 0.1 }
          : { x: base.x, y: base.y + 8, rot: 0, brazos: 0.12, agachado: 1 };
    } else {
      const vx = z.x - base.x, vy = z.y - base.y;
      const d = Math.hypot(vx, vy), largo = 56;
      fin = { x: base.x + (vx / d) * (d - largo), y: base.y + (vy / d) * (d - largo), rot: Math.atan2(vx, -vy), brazos: 1, agachado: 0 };
    }
    const cae = st.fase === 'resultado' && lado !== 0 ? suave(clamp((ahora - st.t0) / 420, 0, 1)) : 0;
    return {
      x: lerp(base.x, fin.x, k), y: lerp(lerp(base.y, fin.y, k), 246, cae * 0.85),
      rot: lerp(0, fin.rot, k) + cae * lado * 0.25, brazos: lerp(base.brazos, fin.brazos, k), agachado: lerp(base.agachado, fin.agachado, k),
    };
  }
  function manosArquero(a) {
    const L = 56;
    return { x: a.x + Math.sin(a.rot) * L, y: a.y - Math.cos(a.rot) * L * (a.brazos > 0.6 ? 1 : 0.45) };
  }
  function posturaPateador(ahora) {
    const en = ahora - st.t0;
    if (st.fase === 'carrera') {
      const k = clamp(en / 620, 0, 1);
      return { x: lerp(PATEADOR0.x, PATEADOR1.x, k), y: lerp(PATEADOR0.y, PATEADOR1.y, k), s: lerp(PATEADOR0.s, PATEADOR1.s, k), paso: Math.sin(k * Math.PI * 5), patada: clamp((k - 0.82) / 0.18, 0, 1), brazos: 0.2 + Math.abs(Math.sin(k * Math.PI * 5)) * 0.12 };
    }
    if (st.fase === 'vuelo') return { ...PATEADOR1, paso: 0, patada: clamp(1 - en / 200, 0, 1), brazos: 0.25 };
    if (st.fase === 'resultado' || st.fase === 'fin') {
      const gol = st.tiro?.resultado === 'gol';
      const k = suave(clamp(en / 300, 0, 1));
      return { ...PATEADOR1, y: PATEADOR1.y - (gol ? Math.abs(Math.sin(en / 170)) * 9 : 0), paso: 0, patada: 0, brazos: lerp(0.25, gol ? 1 : 0.72, k) };
    }
    return { ...PATEADOR0, paso: 0, patada: 0, brazos: 0.12 };
  }
  function posturaPelota(ahora, arq) {
    const t = st.tiro;
    if (!t || st.fase === 'carrera' || st.fase === 'apuntar' || st.fase === 'atajar' || st.fase === 'intro') return { ...PELOTA0, r: 8.5, giro: 0, alfa: 1, lejos: false };
    const en = ahora - st.t0;
    if (st.fase === 'vuelo') {
      const k = clamp(en / t.dur, 0, 1);
      const curva = Math.sin(k * Math.PI) * (5 + 16 * (1 - t.p));
      return { x: lerp(PELOTA0.x, t.pt.x, k), y: lerp(PELOTA0.y, t.pt.y, k) - curva, r: lerp(8.5, 5.2, k), giro: k * 9, alfa: 1, lejos: true };
    }
    // Después de llegar
    const u = clamp(en / 600, 0, 1.6);
    const lado = Math.sign(t.pt.x - ARCO_CX) || 1;
    if (t.resultado === 'gol') {
      const k = clamp(en / 380, 0, 1);
      return { x: t.pt.x + lado * 5 * k, y: lerp(t.pt.y, ARCO.y2 - 6, k * k), r: 5, giro: 9 + k * 2, alfa: 1, lejos: true, enRed: true };
    }
    if (t.resultado === 'atajada') {
      const m = manosArquero(arq);
      if (Math.hypot(m.x - t.pt.x, m.y - t.pt.y) < 20) return { x: m.x, y: m.y, r: 5.4, giro: 9, alfa: 1, lejos: true }; // la embolsa
      return { x: t.pt.x + lado * 70 * u, y: Math.min(t.pt.y - 70 * u + 150 * u * u, 300), r: 5.2 + u, giro: 9 + u * 6, alfa: 1, lejos: true };
    }
    if (t.resultado === 'palo') {
      return { x: t.pt.x - lado * 46 * u + (t.pt.y < ARCO.y1 + 6 ? lado * 20 * u : 0), y: Math.min(t.pt.y + 20 * u + 150 * u * u, 330), r: 5.2 + u * 1.6, giro: 9 - u * 6, alfa: 1, lejos: true };
    }
    const dx = t.pt.x - PELOTA0.x, dy = t.pt.y - PELOTA0.y; // afuera: sigue de largo
    return { x: t.pt.x + dx * 0.22 * u, y: t.pt.y + dy * 0.22 * u, r: Math.max(5.2 - u * 1.2, 3.4), giro: 9 + u * 5, alfa: clamp(1.5 - u, 0, 1), lejos: true };
  }

  /* ----- Bucle ----- */
  function avanzar(ahora) {
    const en = ahora - st.t0;
    if (st.fase === 'apuntar') st.indicador = valorIndicador(ahora);
    else if (st.fase === 'atajar' && en > 6000) elegirZona({ col: 1, fila: 1 }); // si no elegís, se queda parado
    else if (st.fase === 'carrera' && en >= 620) fase('vuelo');
    else if (st.fase === 'vuelo' && en >= st.tiro.dur) llego();
    else if (st.fase === 'resultado' && en >= 1700) siguiente();
  }
  function dibujar(ahora) {
    ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
    const salto = st.festejo && ahora - st.festejo < 1500 ? Math.abs(Math.sin((ahora - st.festejo) / 110)) * 3.5 : 0;
    if (tribuna) ctx.drawImage(tribuna, 0, -salto, W, PISO_TRIBUNA + 12);
    ctx.drawImage(alambrado, 0, 0, W, PISO_TRIBUNA + 12);
    pasto(ctx);

    const pateoYo = st.turno === 'patear';
    const arq = posturaArquero(ahora);
    const pat = posturaPateador(ahora);
    const pel = posturaPelota(ahora, arq);
    const enRed = st.fase === 'resultado' && st.tiro?.resultado === 'gol';
    arco(ctx, enRed ? Math.sin((ahora - st.t0) / 60) * 5 * Math.max(0, 1 - (ahora - st.t0) / 700) : 0);
    if (pel.enRed) pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro);
    palos(ctx);

    // Sombras
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(arq.x, 268, 20, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(pat.x, pat.y + 42 * pat.s, 20 * pat.s, 5.5 * pat.s, 0, 0, 7); ctx.fill();
    if (st.yo) {
      figura(ctx, { ...arq, s: 1, kit: pateoYo ? st.kitArqRival : st.kitArqYo, espalda: false });
      if (pel.lejos && !pel.enRed) pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro, pel.alfa);
      figura(ctx, { ...pat, kit: pateoYo ? st.yo : st.rival, espalda: true });
      if (!pel.lejos) {
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath(); ctx.ellipse(pel.x + 2, pel.y + 7, 9, 3, 0, 0, 7); ctx.fill();
        pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro);
      }
    }
    if (pateoYo && ['apuntar', 'carrera', 'vuelo'].includes(st.fase)) controles(ctx, st, ahora, cv.clientWidth < 520);
  }
  function bucle(ahora) {
    if (desmontado) return;
    avanzar(ahora);
    dibujar(ahora);
    raf = requestAnimationFrame(bucle);
  }

  /* ----- Entrada ----- */
  raiz.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => elegirEquipo(b.dataset.eq)));
  cv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (st.fase === 'apuntar') return frenar();
    if (st.fase !== 'atajar') return;
    const r = cv.getBoundingClientRect();
    const p = { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
    if (p.y > 330) return; // lejos del arco: no cuenta
    elegirZona(zonaDe(p));
  });
  const TECLAS = { q: [0, 2], w: [1, 2], e: [2, 2], a: [0, 1], s: [1, 1], d: [2, 1], z: [0, 0], x: [1, 0], c: [2, 0] };
  function tecla(ev) {
    if (!raiz.isConnected) return limpiar();
    if (ev.target.closest('button, input, select, textarea, a')) return;
    const k = ev.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && st.fase === 'apuntar') { ev.preventDefault(); frenar(); }
    else if (TECLAS[k] && st.fase === 'atajar') { ev.preventDefault(); elegirZona({ col: TECLAS[k][0], fila: TECLAS[k][1] }); }
  }
  document.addEventListener('keydown', tecla);

  function limpiar() {
    desmontado = true;
    cancelAnimationFrame(raf);
    clearTimeout(espera);
    document.removeEventListener('keydown', tecla);
  }
  const obs = new MutationObserver(() => { if (!raiz.isConnected) { limpiar(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });

  raf = requestAnimationFrame(bucle);
  return limpiar;
}
