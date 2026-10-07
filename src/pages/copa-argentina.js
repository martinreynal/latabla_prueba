import { CA_INFO, RONDAS, CATEGORIAS, CLASIFICADOS, cuadroEjemplo } from '../data/copa-argentina.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';

let pestana = 'cuadro';
let desde = CA_INFO.rondaActual;
let seleccion = null;
const CUADRO = cuadroEjemplo();

function escudo(nombre, cat) {
  const ini = nombre.replace(/Club |\(.*\)/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return `<span class="escudo escudo--${cat}" aria-hidden="true">${ini}</span>`;
}

function filaEquipo(e, goles, pen, gana, jugado) {
  if (!e) return '<div class="p-eq p-eq--vacio"><span class="p-eq__nombre">A definir</span></div>';
  return `
  <button type="button" class="p-eq ${gana ? 'p-eq--gana' : ''} ${jugado && !gana ? 'p-eq--pierde' : ''}" data-eq="${e.id}">
    ${escudo(e.nombre, e.cat)}
    <span class="p-eq__txt"><span class="p-eq__nombre">${e.nombre}</span><span class="cat cat--${e.cat}">${CATEGORIAS[e.cat].t}</span></span>
    <span class="p-eq__gol">${jugado ? goles : ''}${pen ? `<small>(${pen})</small>` : ''}</span>
  </button>`;
}

function partido(p) {
  return `
  <div class="partido ${p.jugado ? '' : 'partido--pend'}">
    <p class="partido__meta">${p.fecha} · Sede designada por AFA</p>
    ${filaEquipo(p.l, p.gl, p.pen?.[0], p.jugado && p.ganador === p.l, p.jugado)}
    ${filaEquipo(p.v, p.gv, p.pen?.[1], p.jugado && p.ganador === p.v, p.jugado)}
  </div>`;
}

function cuadro() {
  const i0 = RONDAS.findIndex((r) => r.id === desde);
  const cols = CUADRO.slice(i0);
  return `
  <div class="rondas-nav" role="tablist" aria-label="Ronda desde la que se ve el cuadro">
    ${RONDAS.map((r) => `<button type="button" role="tab" class="ronda-chip ${r.id === desde ? 'activa' : ''} ${r.id === CA_INFO.rondaActual ? 'ronda-chip--actual' : ''}" aria-selected="${r.id === desde}" data-desde="${r.id}">${r.t}</button>`).join('<span class="rondas-nav__sep" aria-hidden="true">·</span>')}
  </div>
  <p class="hoy__nota">Tocá una ronda para ver el cuadro desde ahí hasta la final. Tocá un equipo para ver cómo clasificó. Deslizá de costado para recorrerlo.</p>
  <div class="bracket-scroll">
    <div class="bracket" style="--filas:${cols[0].partidos.length}">
      ${cols.map((ronda, ci) => `
        <div class="b-col ${ci === cols.length - 1 ? 'b-col--final' : ''}">
          <h3 class="b-col__t">${ronda.t}<small>${ronda.fechas}</small></h3>
          <div class="b-col__cuerpo">
            ${ci === cols.length - 1
              ? `<div class="b-slot">${partido(ronda.partidos[0])}</div>`
              : pares(ronda.partidos).map(([a, b]) => `<div class="b-par"><div class="b-slot">${partido(a)}</div><div class="b-slot">${partido(b)}</div></div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
  </div>
  <div id="panel-eq" class="panel-eq" aria-live="polite">${seleccion ? panelEquipo(seleccion) : ''}</div>`;
}

const pares = (arr) => { const o = []; for (let i = 0; i < arr.length; i += 2) o.push([arr[i], arr[i + 1]]); return o; };

function panelEquipo(id) {
  let e = null;
  const camino = [];
  for (const r of CUADRO) {
    for (const p of r.partidos) {
      if (p.l?.id === id || p.v?.id === id) {
        e = p.l?.id === id ? p.l : p.v;
        const rival = p.l?.id === id ? p.v : p.l;
        if (!p.jugado) camino.push({ r: r.t, t: rival ? `Por jugar contra ${rival.nombre}` : 'Por jugar', tipo: 'actual' });
        else {
          const gano = p.ganador.id === id;
          const res = p.l.id === id ? `${p.gl}–${p.gv}` : `${p.gv}–${p.gl}`;
          const pen = p.pen ? ` (penales ${p.l.id === id ? p.pen.join('–') : [...p.pen].reverse().join('–')})` : '';
          camino.push({ r: r.t, t: `${gano ? 'Le ganó' : 'Perdió'} ${res}${pen} a ${rival.nombre}`, tipo: gano ? 'ok' : 'baja' });
        }
      }
    }
  }
  if (!e) return '';
  return `
  <div class="panel-eq__caja">
    <div class="panel-eq__cab">${escudo(e.nombre, e.cat)}<div><p class="panel-eq__nombre">${e.nombre}</p><span class="cat cat--${e.cat}">${CATEGORIAS[e.cat].t}</span></div>
      <button type="button" class="icon-btn" id="cerrar-panel" aria-label="Cerrar">${icon('close', 20)}</button></div>
    <p class="panel-eq__motivo"><span>¿Cómo clasificó?</span>${e.motivo}.</p>
    <p class="panel-eq__regla">${CATEGORIAS[e.cat].regla}</p>
    <a href="/equipo/${e.id}" data-link class="btn-categoria">Ver perfil del club</a>
    <ol class="recorrido">${camino.map((c) => `<li class="recorrido__paso recorrido__paso--${c.tipo}"><span class="recorrido__fase">${c.r}</span><span class="recorrido__texto">${c.t}</span></li>`).join('')}</ol>
  </div>`;
}

function clasificados() {
  const nom = (x) => (typeof x === 'string' ? { n: x } : x);
  return `
  <p class="hoy__nota">Así se armaron los 64 del cuadro principal 2026. Cada categoría aporta una cantidad fija de cupos según lo que hizo en la temporada 2025. Si un club cambió de categoría desde entonces, se indica dónde juega hoy.</p>
  <div class="cupos" aria-label="Cupos por categoría">
    ${Object.entries(CATEGORIAS).map(([k, c]) => `<div class="cupos__item" style="flex-grow:${c.cupos}"><span class="cat cat--${k}">${c.t}</span><strong>${c.cupos}</strong></div>`).join('')}
  </div>
  <div class="clasif-grid">
    ${Object.entries(CLASIFICADOS).map(([k, lista]) => `
      <section class="clasif">
        <header class="copa__cab"><h2>${{ primera: 'Primera División 2025', nacional: 'Primera Nacional 2025', bmetro: 'Primera B 2025', primerac: 'Primera C 2025', federal: 'Federal A 2025' }[k]}</h2><span>${CATEGORIAS[k].cupos} cupos</span></header>
        <p class="clasif__regla">${CATEGORIAS[k].regla}</p>
        <ul class="clasif__lista">
          ${lista.map(nom).map((x) => `
            <li>${escudo(x.n, k)}<span class="clasif__n">${x.n}${x.nota ? `<small>${x.nota}</small>` : ''}</span>${x.hoy ? `<span class="clasif__hoy">${icon('chevron', 12)}Hoy: ${x.hoy}</span>` : ''}</li>`).join('')}
        </ul>
      </section>`).join('')}
  </div>
  <p class="hist__pie">Fuente: sorteo de la fase final (10/12/2025) y Boletín AFA 6608. Escudos: iniciales hasta cargar imágenes con permiso de uso.</p>`;
}

function contenido() {
  return pestana === 'clasificados' ? clasificados() : cuadro();
}

export function copaArgentina() {
  return {
    titulo: 'Copa Argentina 2026 · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--ca">
      <div class="tabla-pag__cab">
        <h1 class="titulo-grande">Copa Argentina ${CA_INFO.edicion}</h1>
        <p class="tabla-pag__torneo">64 equipos de cinco categorías · eliminación directa a partido único</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="ca-datos">
        <div><span>Ronda actual</span><strong>Cuartos de final</strong></div>
        <div><span>Final</span><strong>${CA_INFO.final}</strong></div>
        <div><span>Premio</span><strong>Libertadores 2027</strong></div>
      </div>
      <ul class="ca-reglas">
        <li>Si empatan a los 90 minutos, penales directo.</li>
        <li>El cuadro completo quedó fijo desde el sorteo de 32avos.</li>
        <li>AFA designa los estadios.</li>
        <li>${CA_INFO.defensor}</li>
      </ul>
      <div class="pestanas" role="tablist" aria-label="Vista">
        <button role="tab" type="button" class="pestana" data-vista="cuadro">Cuadro</button>
        <button role="tab" type="button" class="pestana" data-vista="clasificados">¿Cómo clasificó?</button>
      </div>
      <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span><span id="aviso-datos"></span></p>
      <div id="ca-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const cont = document.getElementById('ca-contenido');
      const pintar = () => {
        cont.innerHTML = contenido();
        document.getElementById('aviso-datos').textContent = pestana === 'cuadro' ? 'Cuadro con datos de ejemplo' : 'Clasificados reales 2026';
        document.querySelectorAll('[data-vista]').forEach((b) => {
          const on = b.dataset.vista === pestana;
          b.classList.toggle('activa', on);
          b.setAttribute('aria-selected', String(on));
        });
        cont.querySelectorAll('[data-desde]').forEach((b) => b.addEventListener('click', () => { desde = b.dataset.desde; pintar(); }));
        cont.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => {
          seleccion = b.dataset.eq;
          const panel = document.getElementById('panel-eq');
          panel.innerHTML = panelEquipo(seleccion);
          panel.querySelector('#cerrar-panel')?.addEventListener('click', () => { seleccion = null; panel.innerHTML = ''; });
          panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }));
        document.getElementById('cerrar-panel')?.addEventListener('click', () => { seleccion = null; pintar(); });
      };
      document.querySelectorAll('[data-vista]').forEach((b) =>
        b.addEventListener('click', () => { pestana = b.dataset.vista; pintar(); })
      );
      pintar();
    },
  };
}
