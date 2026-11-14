// Cuadro de la Copa Argentina: dos mitades que se encuentran en la final, con líneas entre rondas,
// zoom, desplazamiento y detalle de cada cruce.
import { RONDAS, partidoDe } from './copa-logica.js';
import { equipoCopa, CATEGORIAS } from '../data/copa-equipos.js';
import { escudoHtml } from './penales-dibujo.js';

const CW = 172, CG = 30, MH = 46, VS = 54, TOP = 34;
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
  const titulos = RONDAS.map((t, r) => {
    if (r === 5) return `<span class="cz__ronda" style="left:${posicion(5, 0).x}px">${t}</span>`;
    return [0, (32 >> r) - 1].map((i) => `<span class="cz__ronda" style="left:${posicion(r, i).x}px">${t}</span>`).join('');
  }).join('');
  const final = posicion(5, 0);
  const camp = copa.rondas[5]?.[0]?.gan;
  const copaHtml = `<div class="cz__campeon ${camp === copa.equipo ? 'cz__campeon--yo' : ''}" style="left:${final.x}px;top:${final.y - 104}px">
    ${trofeo(44)}<span class="cz__campeon-tit">Campeón</span>
    <span class="cz__campeon-eq">${camp ? `${escudoHtml(equipoCopa(camp), 'cz__escudo')}${equipoCopa(camp).corto}` : 'Por definir'}</span></div>`;
  return `
    <div class="cz__plano" style="width:${ANCHO}px;height:${ALTO}px">
      <svg class="cz__lineas" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" aria-hidden="true">
        <path d="${lineas}" class="cz__linea"/><path d="${lineasYo}" class="cz__linea cz__linea--yo"/>
      </svg>
      ${titulos}${copaHtml}${cajas}
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

// Zoom, detalle al tocar un cruce y centrado en el partido del usuario.
export function activarCuadro(visor, copa, alDetalle) {
  const lienzo = visor.querySelector('.cz__lienzo');
  const plano = visor.querySelector('.cz__plano');
  let zoom = visor.clientWidth < 600 ? 0.62 : 0.8;
  function aplicar() {
    plano.style.transform = `scale(${zoom})`;
    lienzo.style.width = `${ANCHO * zoom}px`;
    lienzo.style.height = `${ALTO * zoom}px`;
  }
  function centrar() {
    const r = copa.estado === 'eliminado' ? copa.eliminadoEn : Math.min(copa.ronda, 5);
    const p = posicion(r, partidoDe(copa, copa.equipo, 0).i >> r);
    visor.scrollLeft = (p.x + CW / 2) * zoom - visor.clientWidth / 2;
    visor.scrollTop = (p.y + MH / 2) * zoom - visor.clientHeight / 2;
  }
  function cambiar(f) {
    const cx = (visor.scrollLeft + visor.clientWidth / 2) / zoom, cy = (visor.scrollTop + visor.clientHeight / 2) / zoom;
    zoom = Math.max(0.35, Math.min(1.4, zoom * f));
    aplicar();
    visor.scrollLeft = cx * zoom - visor.clientWidth / 2;
    visor.scrollTop = cy * zoom - visor.clientHeight / 2;
  }
  plano.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]');
    if (!b) return;
    plano.querySelector('.cz--sel')?.classList.remove('cz--sel');
    b.classList.add('cz--sel');
    const [r, i] = b.dataset.m.split('-').map(Number);
    alDetalle(detalleCruce(copa, r, i));
  });
  aplicar();
  centrar();
  return { mas: () => cambiar(1.25), menos: () => cambiar(0.8), centrar };
}
