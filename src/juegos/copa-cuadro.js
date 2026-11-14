// Cuadro de la Copa Argentina: dos mitades que se encuentran en la final, con líneas entre rondas,
// zoom, desplazamiento y detalle de cada cruce.
import { RONDAS, partidoDe } from './copa-logica.js';
import { equipoCopa, CATEGORIAS } from '../data/copa-equipos.js';
import { escudoHtml } from './penales-dibujo.js';

// Medidas del cuadro a zoom 100 %: pensadas para leerse cómodas en escritorio.
const CW = 214, CG = 40, MH = 60, VS = 70, TOP = 44;
const ANCHO = 11 * CW + 10 * CG, ALTO = TOP + 16 * VS + 6;
const cat = (e) => CATEGORIAS.find((c) => c.clave === e.cat).corto;

// Posición de cada cruce. Las rondas 0 a 4 se parten en mitad izquierda y derecha; la final va al centro.
function posicion(r, i) {
  if (r === 5) return { x: 5 * (CW + CG), y: posicion(4, 0).y };
  const porLado = (32 >> r) / 2;
  const izq = i < porLado;
  const x = (izq ? r : 10 - r) * (CW + CG);
  if (r === 0) return { x, y: TOP + (i % 16) * VS };
  return { x, y: (posicion(r - 1, 2 * i).y + posicion(r - 1, 2 * i + 1).y) / 2 };
}

function fila(copa, m, id) {
  if (!id) return '<span class="cz__eq cz__eq--vacio"><span class="cz__nombre">Por definir</span></span>';
  const e = equipoCopa(id);
  const soyA = m.a === id;
  const jugado = !!m.gan;
  const goles = jugado ? (soyA ? m.ga : m.gb) : '';
  const pen = jugado && m.pen ? `<small>(${soyA ? m.pen[0] : m.pen[1]})</small>` : '';
  const clases = ['cz__eq', id === copa.equipo ? 'cz__eq--yo' : '', jugado ? (m.gan === id ? 'cz__eq--gana' : 'cz__eq--pierde') : ''].join(' ');
  return `<span class="${clases}">${escudoHtml(e, 'cz__escudo')}<span class="cz__nombre">${e.corto}</span><span class="cz__goles">${goles}${pen}</span></span>`;
}

export function htmlCuadro(copa) {
  const i0 = partidoDe(copa, copa.equipo, 0).i;
  const hasta = copa.estado === 'eliminado' ? copa.eliminadoEn : 5;
  const enCamino = (r, i) => r <= hasta && i === i0 >> r;
  let cajas = '', lineas = '', lineasYo = '';
  for (let r = 0; r < 6; r++) {
    const n = 32 >> r;
    for (let i = 0; i < n; i++) {
      const m = copa.rondas[r]?.[i] ?? { a: null, b: null };
      const p = posicion(r, i);
      const actual = copa.partido && r === copa.ronda && enCamino(r, i);
      cajas += `<button type="button" class="cz ${enCamino(r, i) ? 'cz--camino' : ''} ${actual ? 'cz--actual' : ''}" data-m="${r}-${i}" style="left:${p.x}px;top:${p.y}px">${fila(copa, m, m.a)}${fila(copa, m, m.b)}</button>`;
      if (r < 5) {
        const q = posicion(r + 1, i >> 1);
        const haciaDerecha = p.x < q.x;
        const x1 = haciaDerecha ? p.x + CW : p.x, x2 = haciaDerecha ? q.x : q.x + CW;
        const y1 = p.y + MH / 2, y2 = q.y + MH / 2, xm = (x1 + x2) / 2;
        const d = `M${x1} ${y1}H${xm}V${y2}H${x2}`;
        if (enCamino(r, i) && r < hasta) lineasYo += d; else lineas += d;
      }
    }
  }
  // Títulos de ronda: van en una franja fija arriba del visor (ver activarCuadro), no dentro del plano.
  const titulos = RONDAS.map((t, r) => {
    if (r === 5) return `<span class="cz__ronda" data-x="${posicion(5, 0).x}">${t}</span>`;
    return [0, (32 >> r) - 1].map((i) => `<span class="cz__ronda" data-x="${posicion(r, i).x}">${t}</span>`).join('');
  }).join('');
  const final = posicion(5, 0);
  const camp = copa.rondas[5]?.[0]?.gan;
  const copaHtml = `<div class="cz__campeon ${camp === copa.equipo ? 'cz__campeon--yo' : ''}" style="left:${final.x}px;top:${final.y - 128}px">
    ${trofeo(56)}<span class="cz__campeon-tit">Campeón</span>
    <span class="cz__campeon-eq">${camp ? `${escudoHtml(equipoCopa(camp), 'cz__escudo')}${equipoCopa(camp).corto}` : 'Por definir'}</span></div>`;
  return `
    <div class="cz__titulos" aria-hidden="true">${titulos}</div>
    <div class="cz__plano" style="width:${ANCHO}px;height:${ALTO}px">
      <svg class="cz__lineas" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" aria-hidden="true">
        <path d="${lineas}" class="cz__linea"/><path d="${lineasYo}" class="cz__linea cz__linea--yo"/>
      </svg>
      ${copaHtml}${cajas}
    </div>`;
}

export function trofeo(px) {
  return `<svg class="trofeo" width="${px}" height="${px}" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M14 6h20v10c0 7-4.5 12-10 12S14 23 14 16z" fill="#D6C34A"/>
    <path d="M14 9H7c0 7 3 11 8.5 12M34 9h7c0 7-3 11-8.5 12" fill="none" stroke="#D6C34A" stroke-width="3" stroke-linecap="round"/>
    <path d="M21 28h6v7h-6z" fill="#BFAC38"/><path d="M15 35h18v4H15z" fill="#D6C34A"/><path d="M12 39h24v4H12z" fill="#8A7BA8"/>
    <path d="M18 9v8c0 3 1 6 3 8" fill="none" stroke="#F1EFE8" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}

export function detalleCruce(copa, r, i) {
  const m = copa.rondas[r]?.[i];
  if (!m || !m.a || !m.b) return `<strong>${RONDAS[r]}</strong> · Todavía no se conocen los dos equipos de este cruce.`;
  const a = equipoCopa(m.a), b = equipoCopa(m.b);
  const cab = `<strong>${RONDAS[r]}</strong> · ${a.nombre} <em>(${cat(a)})</em> vs ${b.nombre} <em>(${cat(b)})</em>`;
  if (!m.gan) return `${cab} · Por jugar.`;
  const pen = m.pen ? ` · Penales: ${m.pen[0]} – ${m.pen[1]}` : '';
  return `${cab} · 90': ${m.ga} – ${m.gb}${pen} · Pasó <strong>${equipoCopa(m.gan).nombre}</strong>.`;
}

// Zoom, arrastre, detalle al tocar un cruce y centrado en el partido del usuario.
export function activarCuadro(visor, copa, alDetalle, alZoom = () => {}) {
  const lienzo = visor.querySelector('.cz__lienzo');
  const plano = visor.querySelector('.cz__plano');
  const MIN = 0.3, MAX = 1.6;
  // A 100 % se lee sin zoom del navegador; en pantallas angostas arranca más chico.
  let zoom = visor.clientWidth < 700 ? 0.62 : 1;
  const titulos = [...visor.querySelectorAll('.cz__ronda')];
  function aplicar() {
    plano.style.transform = `scale(${zoom})`;
    lienzo.style.width = `${ANCHO * zoom}px`;
    lienzo.style.height = `${ALTO * zoom}px`;
    titulos.forEach((t) => { t.style.left = `${Number(t.dataset.x) * zoom}px`; t.style.width = `${CW * zoom}px`; t.style.fontSize = `${Math.max(8.5, Math.min(13, 13 * zoom))}px`; });
    alZoom(zoom);
  }
  function irA(x, y) {
    visor.scrollLeft = x * zoom - visor.clientWidth / 2;
    visor.scrollTop = y * zoom - visor.clientHeight / 2;
  }
  function centrar(volverA100 = false) {
    if (volverA100 && zoom < 0.9 && visor.clientWidth >= 700) { zoom = 1; aplicar(); }
    const r = copa.estado === 'eliminado' ? copa.eliminadoEn : Math.min(copa.ronda, 5);
    const p = posicion(r, partidoDe(copa, copa.equipo, 0).i >> r);
    irA(p.x + CW / 2, p.y + MH / 2);
  }
  // Cambia el zoom manteniendo fijo el punto (px, py) del visor, en coordenadas de pantalla.
  function cambiar(nuevo, px = visor.clientWidth / 2, py = visor.clientHeight / 2) {
    const cx = (visor.scrollLeft + px) / zoom, cy = (visor.scrollTop + py) / zoom;
    zoom = Math.max(MIN, Math.min(MAX, nuevo));
    aplicar();
    visor.scrollLeft = cx * zoom - px;
    visor.scrollTop = cy * zoom - py;
  }
  function todo() {
    zoom = Math.max(MIN, Math.min(visor.clientWidth / ANCHO, visor.clientHeight / ALTO));
    aplicar();
    visor.scrollLeft = 0; visor.scrollTop = 0;
  }

  // Arrastrar para desplazarse. La captura del puntero recién empieza cuando hay movimiento,
  // así un clic simple sigue abriendo el detalle del cruce.
  let arr = null, finArrastre = 0;
  visor.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    arr = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, sl: visor.scrollLeft, st: visor.scrollTop, movio: false };
  });
  visor.addEventListener('pointermove', (ev) => {
    if (!arr || ev.pointerId !== arr.id) return;
    const dx = ev.clientX - arr.x, dy = ev.clientY - arr.y;
    if (!arr.movio) {
      if (Math.hypot(dx, dy) < 5) return;
      arr.movio = true;
      visor.setPointerCapture(arr.id);
      visor.classList.add('cz__visor--arrastre');
    }
    visor.scrollLeft = arr.sl - dx;
    visor.scrollTop = arr.st - dy;
  });
  const soltar = () => {
    if (!arr) return;
    if (arr.movio) finArrastre = performance.now();
    arr = null;
    visor.classList.remove('cz__visor--arrastre');
  };
  visor.addEventListener('pointerup', soltar);
  visor.addEventListener('pointercancel', soltar);
  // Ctrl/⌘ + rueda: zoom hacia el puntero.
  visor.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    const r = visor.getBoundingClientRect();
    cambiar(zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12), ev.clientX - r.left, ev.clientY - r.top);
  }, { passive: false });
  // Teclado: + y − cambian el zoom; 0 centra el partido propio.
  visor.addEventListener('keydown', (ev) => {
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); cambiar(zoom * 1.2); }
    else if (ev.key === '-') { ev.preventDefault(); cambiar(zoom / 1.2); }
    else if (ev.key === '0') { ev.preventDefault(); centrar(); }
  });

  plano.addEventListener('click', (ev) => {
    if (performance.now() - finArrastre < 80) return; // fue un arrastre, no un clic
    const b = ev.target.closest('[data-m]');
    if (!b) return;
    plano.querySelector('.cz--sel')?.classList.remove('cz--sel');
    b.classList.add('cz--sel');
    const [r, i] = b.dataset.m.split('-').map(Number);
    alDetalle(detalleCruce(copa, r, i));
  });
  aplicar();
  centrar();
  return { mas: () => cambiar(zoom * 1.2), menos: () => cambiar(zoom / 1.2), todo, centrar: () => centrar(true) };
}
