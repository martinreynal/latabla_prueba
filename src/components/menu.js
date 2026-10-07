import { icon } from '../lib/icons.js';
import { ESTRUCTURA } from '../data/estructura.js';

export function menu() {
  return `
  <div class="scrim" id="scrim" hidden></div>
  <nav class="menu" id="menu" aria-label="Menú de la sección" aria-hidden="true" inert>
    <div class="menu__top">
      <span class="logo logo--sm"><span class="logo__la">LA</span>TABLA</span>
      <button class="icon-btn" id="btn-cerrar" type="button" aria-label="Cerrar menú">${icon('close', 22)}</button>
    </div>

    <div class="menu__grupo">
      <a href="/tablas/primera" data-link class="menu__item menu__item--seccion" data-seccion="tablas">${icon('tabla', 22)}Tablas</a>
      <div class="menu__sub solo-tablas">
        ${ESTRUCTURA.map((g) => g.subs.length === 0 ? `
          <a href="/tablas/${g.slug}" data-link class="menu__item menu__item--div" data-ruta="/tablas/${g.slug}" data-grupo="${g.slug}">
            <span><strong>${g.nombre}</strong>${g.torneo ? `<small>${g.torneo}</small>` : ''}</span>
          </a>` : `
          <details class="menu__arbol" data-grupo="${g.slug}">
            <summary class="menu__item menu__item--div"><span><strong>${g.nombre}</strong><small>${g.subs.map((x) => x[1]).join(' · ')}</small></span>${icon('chevron', 16)}</summary>
            <div class="menu__hojas">
              ${g.subs.length > 1 || g.subs[0][0] ? `<a href="/tablas/${g.slug}" data-link class="menu__hoja menu__hoja--todo" data-ruta="/tablas/${g.slug}">Ver ${g.nombre.toLowerCase()}</a>` : ''}
              ${g.subs.map(([s2, t]) => `<a href="/tablas/${g.slug}${s2 ? '/' + s2 : ''}" data-link class="menu__hoja" data-ruta="/tablas/${g.slug}${s2 ? '/' + s2 : ''}">${t}</a>`).join('')}
            </div>
          </details>`).join('')}
      </div>
      <a href="/" data-link class="menu__item menu__item--seccion" data-seccion="juegos">${icon('grilla', 22)}Juegos</a>
    </div>

    <p class="menu__pie solo-tablas"><span class="punto-vivo punto-vivo--apagado"></span> Datos cargados a mano · <a href="/admin" data-link class="menu__admin">Cargar resultados</a></p>
  </nav>

  <nav class="tabs" aria-label="Secciones">
    <a href="/tablas/primera" data-link class="tabs__item" data-seccion="tablas">${icon('tabla', 22)}<span>Tablas</span></a>
    <a href="/" data-link class="tabs__item" data-seccion="juegos">${icon('grilla', 22)}<span>Juegos</span></a>
  </nav>`;
}

let ultimoFoco = null;

export function iniciarMenu() {
  const nav = document.getElementById('menu');
  const scrim = document.getElementById('scrim');
  const btnMenu = document.getElementById('btn-menu');
  const btnCerrar = document.getElementById('btn-cerrar');

  btnMenu.addEventListener('click', abrirMenu);
  btnCerrar.addEventListener('click', cerrarMenu);
  scrim.addEventListener('click', cerrarMenu);
  nav.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });
}

export function abrirMenu() {
  const nav = document.getElementById('menu');
  const scrim = document.getElementById('scrim');
  ultimoFoco = document.activeElement;
  scrim.hidden = false;
  nav.removeAttribute('inert');
  nav.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    document.body.classList.add('menu-abierto');
  });
  document.getElementById('btn-menu').setAttribute('aria-expanded', 'true');
  document.getElementById('btn-cerrar').focus();
}

export function cerrarMenu() {
  const nav = document.getElementById('menu');
  const scrim = document.getElementById('scrim');
  if (!document.body.classList.contains('menu-abierto')) return;
  document.body.classList.remove('menu-abierto');
  nav.setAttribute('inert', '');
  nav.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-menu').setAttribute('aria-expanded', 'false');
  setTimeout(() => { scrim.hidden = true; }, 220);
  if (ultimoFoco) ultimoFoco.focus();
}

export function marcarRutaActiva(path) {
  const seccion = path.startsWith('/tablas') || path.startsWith('/equipo') ? 'tablas' : 'juegos';
  document.body.dataset.seccion = seccion;
  document.querySelectorAll('.tabs__item, .menu__item--seccion').forEach((a) => {
    const activa = a.dataset.seccion === seccion;
    a.classList.toggle('activo', activa);
    if (activa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('.menu__arbol').forEach((d) => { d.open = path.startsWith('/tablas/' + d.dataset.grupo); d.classList.toggle('activo', d.open); });
  document.querySelectorAll('.menu__item[data-ruta], .menu__hoja').forEach((a) => {
    a.classList.toggle('activo', a.dataset.ruta === path);
    if (a.dataset.ruta === path) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
