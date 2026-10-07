import { COPAS_ACTUALES, COPAS_HISTORIAL } from '../data/copas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';

let pestana = 'actuales';
let anio = Number(Object.keys(COPAS_HISTORIAL).sort().reverse()[0]);

const flechaAbajo = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6"/></svg>';

/* ---------- Piezas ---------- */
function participante(p) {
  const clases = ['part', p.nombre ? '' : 'part--pendiente', p.campeon ? 'part--campeon' : ''].join(' ');
  return `
  <div class="${clases}">
    ${p.campeon ? '<span class="part__copa">Campeón</span>' : ''}
    <span class="part__nombre">${p.nombre ?? 'Por definir'}</span>
    <span class="part__motivo">${p.motivo}</span>
  </div>`;
}

function embudo(fuentes, destino) {
  return `
  <div class="embudo" style="--n:${fuentes.length}" aria-label="De dónde salen las plazas">
    <div class="embudo__fuentes">${fuentes.map((f) => `<span class="embudo__fuente">${f}</span>`).join('')}</div>
    <div class="embudo__barra"></div>
    <div class="embudo__destino">${flechaAbajo}<span>${destino}</span></div>
  </div>`;
}

function camino(c) {
  const conCamino = c.participantes.filter((p) => p.camino);
  if (!conCamino.length) return '';
  return `
  <details class="camino">
    <summary>¿Cómo llegaron hasta acá?</summary>
    <div class="camino__arbol" style="--n:${conCamino.length}">
      ${conCamino.map((p) => `
        <div class="camino__rama">
          <span class="camino__equipo">${p.nombre ?? 'Por definir'}</span>
          ${p.camino.map((paso, i) => `
            <span class="camino__flecha">${flechaAbajo}</span>
            <span class="camino__paso ${i === p.camino.length - 1 ? 'camino__paso--final' : ''}">${paso}</span>`).join('')}
        </div>`).join('')}
    </div>
    <div class="camino__destino">${flechaAbajo}<span>${c.nombre}</span></div>
  </details>`;
}

function meta(c) {
  return `
  <div class="copa__meta">
    <span class="estado estado--${c.estado.tipo}">${c.estado.texto}</span>
    ${c.fecha ? `<p class="copa__fecha">${c.fecha}</p>` : '<p class="copa__fecha copa__fecha--pend">Fecha a confirmar</p>'}
    <p class="copa__estadio">${c.estadio ?? 'Estadio a confirmar'}</p>
  </div>`;
}

function tarjetaDuelo(c) {
  const [a, b] = c.participantes;
  const centro = c.resultado ? `<span class="duelo__res">${c.resultado}</span>` : '<span class="duelo__vs">VS</span>';
  return `
  <article class="copa" id="copa-${c.id}">
    <header class="copa__cab"><h2>${c.nombre}</h2><span>${c.edicion}</span></header>
    ${meta(c)}
    ${embudo(c.fuentes, c.nombre)}
    <div class="duelo">${participante(a)}${centro}${participante(b)}</div>
    <p class="copa__explica">${c.explicacion}</p>
    ${c.aclaracion ? `<p class="copa__aclara"><strong>Ojo con el nombre.</strong> ${c.aclaracion}</p>` : ''}
    ${c.siguiente ? `
      <div class="copa__siguiente">
        <p class="copa__sig-tit">${c.siguiente.edicion} <span class="estado estado--curso">${c.siguiente.estado}</span></p>
        <div class="duelo duelo--chico">${participante(c.siguiente.participantes[0])}<span class="duelo__vs">VS</span>${participante(c.siguiente.participantes[1])}</div>
      </div>` : ''}
    ${c.nota ? `<p class="copa__nota">${c.nota}</p>` : ''}
    ${camino(c)}
  </article>`;
}

function tarjetaTriangular(c) {
  return `
  <article class="copa copa--triangular" id="copa-${c.id}">
    <header class="copa__cab"><h2>${c.nombre}</h2><span>${c.edicion}</span></header>
    ${meta(c)}
    ${embudo(c.fuentes, c.nombre)}
    <div class="tri__equipos">${c.participantes.map(participante).join('')}</div>
    <p class="copa__explica">${c.explicacion}</p>
    <div class="tri__fixture" aria-label="Orden de los partidos">
      ${c.partidos.map((p) => `
        <div class="tri__partido">
          <span class="tri__n">P${p.n}</span>
          <span class="tri__eq">${p.local}</span>
          <span class="tri__vs">vs</span>
          <span class="tri__eq ${p.n > 1 ? 'tri__eq--dep' : ''}">${p.visitante}</span>
        </div>`).join('')}
      <p class="tri__cierre">Después de los tres partidos, <strong>campeón: el que más puntos sumó</strong>.</p>
    </div>
    <ul class="copa__reglas">${c.reglas.map((r) => `<li>${r}</li>`).join('')}</ul>
    <details class="camino">
      <summary>¿Cómo llegaron hasta acá?</summary>
      <div class="camino__arbol" style="--n:3">
        <div class="camino__rama"><span class="camino__paso">Copa Argentina</span><span class="camino__flecha">${flechaAbajo}</span><span class="camino__paso camino__paso--final">Campeón Copa Argentina</span></div>
        <div class="camino__rama"><span class="camino__paso">Trofeo de Campeones + Copa Argentina</span><span class="camino__flecha">${flechaAbajo}</span><span class="camino__paso">Supercopa Argentina</span><span class="camino__flecha">${flechaAbajo}</span><span class="camino__paso camino__paso--final">Campeón Supercopa Argentina</span></div>
        <div class="camino__rama"><span class="camino__paso">Tabla Anual + Trofeo de Campeones</span><span class="camino__flecha">${flechaAbajo}</span><span class="camino__paso">Supercopa Internacional</span><span class="camino__flecha">${flechaAbajo}</span><span class="camino__paso camino__paso--final">Campeón Supercopa Internacional</span></div>
      </div>
      <div class="camino__destino">${flechaAbajo}<span>Recopa de Campeones</span></div>
    </details>
  </article>`;
}

/* ---------- Mapa ---------- */
const NODOS = {
  apertura: { x: 110, y: 10, w: 88, t: 'Apertura', tipo: 'liga', info: 'Torneo del primer semestre. Su campeón va al Trofeo de Campeones. Sus puntos de la fase de zonas suman para la Tabla Anual.' },
  clausura: { x: 210, y: 10, w: 88, t: 'Clausura', tipo: 'liga', info: 'Torneo del segundo semestre. Su campeón va al Trofeo de Campeones. Sus puntos de la fase de zonas suman para la Tabla Anual.' },
  anual: { x: 308, y: 10, w: 86, t: 'Tabla Anual', s: 'Campeón de Liga', tipo: 'liga', info: 'Suma los puntos de la fase de zonas de Apertura y Clausura. El 1.º es Campeón de Liga y juega la Supercopa Internacional.' },
  ca: { x: 4, y: 118, w: 104, t: 'Copa Argentina', s: 'clasificatoria', tipo: 'externa', info: 'Copa de todas las categorías. Su campeón juega la Supercopa Argentina y, desde 2027, la Recopa de Campeones.' },
  tdc: { x: 130, y: 118, w: 168, t: 'Trofeo de Campeones', tipo: 'copa', info: 'Campeón Apertura contra campeón Clausura. Quien gana juega la Supercopa Argentina y la Supercopa Internacional.' },
  sa: { x: 30, y: 240, w: 164, t: 'Supercopa Argentina', tipo: 'copa', info: 'Campeón del Trofeo de Campeones contra campeón de la Copa Argentina. Quien gana va a la Recopa de Campeones.' },
  si: { x: 214, y: 240, w: 180, t: 'Supercopa Internacional', tipo: 'copa', info: 'Campeón de Liga (1.º Tabla Anual) contra campeón del Trofeo de Campeones. "Internacional" es solo el nombre. Quien gana va a la Recopa.' },
  recopa: { x: 100, y: 370, w: 200, h: 54, t: 'Recopa de Campeones', s: 'desde 2027 · triangular', tipo: 'copa copa-top', info: 'Triangular entre los campeones de Copa Argentina, Supercopa Argentina y Supercopa Internacional. Es la copa que cierra el circuito.' },
};
const ARISTAS = [
  ['apertura', 'tdc', 'M154 56 V88 H200 V116'],
  ['clausura', 'tdc', 'M254 56 V88 H228 V116'],
  ['tdc', 'sa', 'M184 164 V202 H140 V238'],
  ['tdc', 'si', 'M244 164 V202 H286 V238'],
  ['anual', 'si', 'M351 56 V238'],
  ['ca', 'sa', 'M62 164 V238'],
  ['ca', 'recopa', 'M14 164 V397 H98'],
  ['sa', 'recopa', 'M112 286 V330 H176 V368'],
  ['si', 'recopa', 'M304 286 V330 H224 V368'],
];

function mapa() {
  const nodo = (id, n) => {
    const h = n.h ?? 46;
    return `
    <g class="nodo nodo--${n.tipo.split(' ').join(' nodo--')}" data-nodo="${id}" tabindex="0" role="button" aria-label="${n.t}">
      <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${h}" rx="3" />
      <rect class="nodo__brillo" x="${n.x + 1}" y="${n.y + 1}" width="${n.w - 2}" height="1" />
      <text class="nodo__t" x="${n.x + n.w / 2}" y="${n.y + (n.s ? h / 2 - 2 : h / 2 + 4)}" text-anchor="middle">${n.t.toUpperCase()}</text>
      ${n.s ? `<text class="nodo__s" x="${n.x + n.w / 2}" y="${n.y + h / 2 + 12}" text-anchor="middle">${n.s}</text>` : ''}
    </g>`;
  };
  return `
  <section class="mapa" aria-labelledby="t-mapa">
    <div class="mapa__cab">
      <h2 id="t-mapa" class="hoy__titulo">El árbol de los títulos</h2>
      <p class="hoy__nota">Cada flecha es una plaza: el campeón de un torneo entra a la copa que señala. Tocá un bloque para ver sus conexiones.</p>
    </div>
    <div class="mapa__lienzo">
      <svg viewBox="0 0 400 432" role="img" aria-label="Mapa de conexiones entre los torneos y copas de AFA">
        <defs>
          <linearGradient id="g-liga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7D6E9A"/><stop offset=".5" stop-color="#6E5F8B"/><stop offset="1" stop-color="#54476E"/></linearGradient>
          <linearGradient id="g-copa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2C33"/><stop offset="1" stop-color="#1C1B1F"/></linearGradient>
          <marker id="punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker>
        </defs>
        ${ARISTAS.map(([a, b, d]) => `<path class="arista" data-de="${a}" data-a="${b}" d="${d}" marker-end="url(#punta)"/>`).join('')}
        ${Object.entries(NODOS).map(([id, n]) => nodo(id, n)).join('')}
      </svg>
    </div>
    <div class="mapa__info" id="mapa-info" aria-live="polite">
      <p class="mapa__info-t">Tocá un torneo o una copa</p>
      <p>El mapa muestra de dónde salen los participantes de cada copa.</p>
    </div>
    <ul class="leyenda leyenda--mapa">
      <li><span class="leyenda__muestra leyenda__muestra--reducido"></span>Torneos de liga</li>
      <li><span class="leyenda__muestra leyenda__muestra--copa"></span>Copas complementarias</li>
      <li><span class="leyenda__muestra leyenda__muestra--externa"></span>Copa Argentina (solo clasifica)</li>
    </ul>
  </section>`;
}

function montarMapa() {
  const svg = document.querySelector('.mapa svg');
  if (!svg) return;
  const info = document.getElementById('mapa-info');
  const elegir = (id) => {
    const vecinos = new Set([id]);
    svg.querySelectorAll('.arista').forEach((a) => {
      const on = a.dataset.de === id || a.dataset.a === id;
      a.classList.toggle('arista--on', on);
      if (on) { vecinos.add(a.dataset.de); vecinos.add(a.dataset.a); }
    });
    svg.classList.add('mapa--foco');
    svg.querySelectorAll('.nodo').forEach((n) => {
      n.classList.toggle('nodo--on', vecinos.has(n.dataset.nodo));
      n.classList.toggle('nodo--sel', n.dataset.nodo === id);
    });
    const n = NODOS[id];
    const entra = ARISTAS.filter((a) => a[1] === id).map((a) => NODOS[a[0]].t);
    const sale = ARISTAS.filter((a) => a[0] === id).map((a) => NODOS[a[1]].t);
    info.innerHTML = `
      <p class="mapa__info-t">${n.t}</p>
      <p>${n.info}</p>
      ${entra.length ? `<p class="mapa__rel"><span>Recibe de</span> ${entra.join(' · ')}</p>` : ''}
      ${sale.length ? `<p class="mapa__rel"><span>Clasifica a</span> ${sale.join(' · ')}</p>` : ''}`;
  };
  svg.querySelectorAll('.nodo').forEach((g) => {
    g.addEventListener('click', () => elegir(g.dataset.nodo));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(g.dataset.nodo); } });
  });
}

/* ---------- Historial ---------- */
function historial() {
  const anios = Object.keys(COPAS_HISTORIAL).sort().reverse();
  const lista = COPAS_HISTORIAL[anio] || [];
  return `
  <section class="historial">
    <div class="anios" role="tablist" aria-label="Año">
      ${anios.map((a) => `<button type="button" role="tab" class="anio ${Number(a) === anio ? 'activa' : ''}" aria-selected="${Number(a) === anio}" data-anio="${a}">${a}</button>`).join('')}
    </div>
    <p class="hoy__nota">Finales jugadas en ${anio}. Cada edición muestra el formato que regía ese año.</p>
    <div class="hist__lista">
      ${lista.map((h) => `
        <article class="hist">
          <header class="copa__cab"><h2>${h.copa}</h2><span>${h.edicion}</span></header>
          <div class="hist__cuerpo">
            <p class="copa__fecha">${h.fecha}</p>
            <p class="copa__estadio">${h.estadio}</p>
            <div class="duelo">
              ${participante({ ...h.campeon, campeon: true })}
              <span class="duelo__res">${h.resultado}</span>
              ${participante(h.subcampeon)}
            </div>
            <p class="hist__formato"><span>Formato ${anio}</span>${h.formato}</p>
          </div>
        </article>`).join('')}
    </div>
    <p class="hist__pie">Se muestran solo ediciones verificadas. Las anteriores se van a cargar desde la base de datos.</p>
  </section>`;
}

/* ---------- Página ---------- */
function contenido() {
  if (pestana === 'mapa') return mapa();
  if (pestana === 'historial') return historial();
  return `<div class="copas-grid">${COPAS_ACTUALES.map((c) => (c.triangular ? tarjetaTriangular(c) : tarjetaDuelo(c))).join('')}</div>`;
}

const SLUG_COPA = { 'trofeo-de-campeones': 'trofeo', 'supercopa-argentina': 'supercopa-argentina', 'supercopa-internacional': 'supercopa-internacional', 'recopa-de-campeones': 'recopa' };

export function copas(sub) {
  const foco = SLUG_COPA[sub];
  if (foco) pestana = 'actuales';
  return {
    titulo: 'Copas AFA · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--copas">
      <div class="tabla-pag__cab">
        <h1 class="titulo-grande">Copas AFA</h1>
        <p class="tabla-pag__torneo">Trofeo de Campeones, supercopas y Recopa: quién las juega y por qué.</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="pestanas" role="tablist" aria-label="Vista">
        <button role="tab" type="button" class="pestana" data-vista="actuales">Actuales</button>
        <button role="tab" type="button" class="pestana" data-vista="mapa">Mapa</button>
        <button role="tab" type="button" class="pestana" data-vista="historial">Historial</button>
      </div>
      <div id="copas-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const cont = document.getElementById('copas-contenido');
      const pintar = () => {
        cont.innerHTML = contenido();
        document.querySelectorAll('[data-vista]').forEach((b) => {
          const on = b.dataset.vista === pestana;
          b.classList.toggle('activa', on);
          b.setAttribute('aria-selected', String(on));
        });
        if (pestana === 'mapa') montarMapa();
        cont.querySelectorAll('[data-anio]').forEach((b) =>
          b.addEventListener('click', () => { anio = Number(b.dataset.anio); pintar(); })
        );
      };
      document.querySelectorAll('[data-vista]').forEach((b) =>
        b.addEventListener('click', () => { pestana = b.dataset.vista; pintar(); })
      );
      pintar();
      if (foco) {
        const card = document.getElementById(`copa-${foco}`);
        if (card) {
          card.classList.add('copa--foco');
          requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'smooth' }));
        }
      }
    },
  };
}
