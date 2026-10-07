import { INFERIORES as INF, fechaJuveniles } from '../data/abajo-ejemplo.js';
import { ordenar } from '../lib/reglas-federal.js';
import { tabla, leyenda, pestanas } from '../components/tablas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

const CATS = [
  ['reserva', 'Reserva'], ['cuarta', 'Cuarta'], ['quinta', 'Quinta'], ['sexta', 'Sexta'],
  ['septima', 'Séptima'], ['octava', 'Octava'], ['novena', 'Novena'], ['general', 'General'], ['fecha', 'Fecha'],
];
const JUV = ['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena'];
const NOMBRE = { cuarta: 'Cuarta', quinta: 'Quinta', sexta: 'Sexta', septima: 'Séptima', octava: 'Octava', novena: 'Novena' };
let cat = 'general';
let abierto = null;

/* ---------- Tabla general acumulada ---------- */
function acumulada() {
  const porClub = new Map();
  JUV.forEach((c) => INF[c].forEach((e) => {
    const a = porClub.get(e.nombre) || { id: e.id, nombre: e.nombre, pts: 0, pj: 0, dg: 0, gf: 0, porCat: {} };
    a.pts += e.pts; a.pj += e.pj; a.dg += e.dg; a.gf += e.gf; a.porCat[c] = e.pts;
    porClub.set(e.nombre, a);
  }));
  const filas = ordenar([...porClub.values()]);
  const maxCat = Math.max(...filas.flatMap((f) => JUV.map((c) => f.porCat[c])));
  const mejorCat = (f) => JUV.reduce((m, c) => (f.porCat[c] > f.porCat[m] ? c : m), JUV[0]);
  const peorCat = (f) => JUV.reduce((m, c) => (f.porCat[c] < f.porCat[m] ? c : m), JUV[0]);
  return `
    <p class="formato-resumen"><strong>Tabla General de Inferiores.</strong> Suma los puntos de cada club en las seis categorías juveniles, de Cuarta a Novena. Muestra qué institución tiene el trabajo de base más parejo. La Reserva no suma. Tocá un club para ver cómo se compone su total.</p>
    <div class="gen">
      <div class="gen__cab" aria-hidden="true"><span>#</span><span>Club</span>${JUV.map((c) => `<span class="gen__c col-opc">${NOMBRE[c].slice(0, 3)}</span>`).join('')}<span class="gen__tot">Pts</span></div>
      ${filas.map((f, i) => {
        const on = abierto === f.nombre;
        return `
        <div class="gen__fila ${i === 0 ? 'gen__fila--lider' : ''} ${on ? 'gen__fila--abierta' : ''}">
          <button type="button" class="gen__btn" data-club="${f.nombre}" aria-expanded="${on}">
            <span class="pos-box">${i + 1}</span>
            <span class="gen__nombre">${f.nombre}</span>
            ${JUV.map((c) => `<span class="gen__c col-opc">${f.porCat[c]}</span>`).join('')}
            <span class="gen__tot">${f.pts}</span>
          </button>
          ${on ? `
          <div class="gen__detalle">
            <p class="gen__resumen"><a href="/equipo/${f.id}" data-link class="eq-link"><strong>${f.nombre} — ${f.pts} pts</strong></a> · más fuerte en ${NOMBRE[mejorCat(f)]}, más flojo en ${NOMBRE[peorCat(f)]}</p>
            <ul class="barras">
              ${JUV.map((c) => `
                <li class="${c === mejorCat(f) ? 'barras--mejor' : ''} ${c === peorCat(f) ? 'barras--peor' : ''}">
                  <span class="barras__cat">${NOMBRE[c]}</span>
                  <span class="barras__pista"><span class="barras__valor" style="width:${Math.round((f.porCat[c] / maxCat) * 100)}%"></span></span>
                  <span class="barras__pts">${f.porCat[c]}</span>
                </li>`).join('')}
            </ul>
            <a href="/equipo/${f.id}" data-link class="btn-categoria gen__perfil">Ver perfil del club</a>
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

/* ---------- Categoría ---------- */
function categoria(c) {
  if (c === 'reserva') {
    return `
      <p class="formato-resumen"><strong>Reserva · Torneo Proyección.</strong> Juegan las reservas de los 30 equipos de Primera, con torneos Apertura y Clausura como la Primera.</p>
      ${leyenda([['ascenso', 'Puntero']])}
      <div class="una-tabla una-tabla--ancha">${tabla('Proyección · Clausura 2026', ordenar(INF.reserva), (p) => (p === 1 ? 'ascenso' : 'neutro'), { goles: true })}</div>
      <p class="aviso aviso--chico">Formato de zonas y definición del Proyección 2026: a confirmar con el reglamento de la Liga Profesional.</p>`;
  }
  return `
    <p class="formato-resumen"><strong>${NOMBRE[c]} división.</strong> 36 equipos, todos contra todos en 35 fechas. Es campeón el que suma más puntos al final, sin playoffs. Fecha ${INF.fechaJuveniles}.</p>
    ${leyenda([['ascenso', 'Puntero · campeón si termina así']])}
    <div class="una-tabla una-tabla--ancha">${tabla(`${NOMBRE[c]} división 2026`, ordenar(INF[c]), (p) => (p === 1 ? 'ascenso' : 'neutro'), { goles: true })}</div>`;
}

/* ---------- Fecha: resultados agrupados por club ---------- */
function fecha() {
  const n = INF.fechaJuveniles;
  const partidos = fechaJuveniles(n);
  return `
    <p class="formato-resumen"><strong>Fecha ${n}.</strong> Cada cruce entre dos clubes se juega en las seis categorías el mismo día: Cuarta, Quinta y Sexta en una cancha, y Séptima, Octava y Novena en la del rival. Tocá un cruce para ver las seis.</p>
    <div class="fecha-lista">
      ${partidos.map((p) => {
        let g = 0, e = 0, pe = 0, pl = 0, pv = 0;
        JUV.forEach((c) => {
          const [a, b] = p.res[c];
          if (a > b) { g++; pl += 3; } else if (a === b) { e++; pl++; pv++; } else { pe++; pv += 3; }
        });
        return `
        <details class="fecha-cruce">
          <summary>
            <span class="fecha-cruce__eq">${p.local}</span>
            <span class="fecha-cruce__pts"><strong>${pl}</strong><small>pts</small><span>–</span><strong>${pv}</strong><small>pts</small></span>
            <span class="fecha-cruce__eq fecha-cruce__eq--der">${p.visitante}</span>
            <span class="fecha-cruce__sub">${p.local} ganó ${g}, empató ${e} y perdió ${pe}</span>
          </summary>
          <table class="tabla tabla--compacta fecha-cruce__tabla">
            <thead><tr><th>Categoría</th><th>Cancha</th><th class="num">${p.local.replace('Club ', '')}</th><th class="num">${p.visitante.replace('Club ', '')}</th></tr></thead>
            <tbody>
              ${JUV.map((c, i) => {
                const [a, b] = p.res[c];
                return `<tr class="${a > b ? 'res--l' : a < b ? 'res--v' : ''}"><td class="equipo">${NOMBRE[c]}</td><td class="num--sec">${i < 3 ? p.local : p.visitante}</td><td class="num">${a}</td><td class="num">${b}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </details>`;
      }).join('')}
    </div>`;
}

export function inferiores(sub) {
  if (sub && CATS.some(([v]) => v === sub)) cat = sub;
  return {
    titulo: 'Inferiores · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--tercera tabla-pag--inf">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Datos de ejemplo</p>
        <h1 class="titulo-grande">Inferiores</h1>
        <p class="tabla-pag__torneo">Reserva y juveniles de AFA · temporada 2026</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div id="inf-tabs"></div>
      <div id="tercera-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const tabs = document.getElementById('inf-tabs');
      const cont = document.getElementById('tercera-contenido');
      const pintar = () => {
        tabs.innerHTML = pestanas(CATS, cat, 'data-cat');
        cont.innerHTML = cat === 'general' ? acumulada() : cat === 'fecha' ? fecha() : categoria(cat);
        tabs.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => irA(`/tablas/inferiores/${b.dataset.cat}`)));
        cont.querySelectorAll('[data-club]').forEach((b) => b.addEventListener('click', () => {
          abierto = abierto === b.dataset.club ? null : b.dataset.club;
          pintar();
          cont.querySelector(`[data-club="${CSS.escape(b.dataset.club)}"]`)?.focus();
        }));
      };
      pintar();
    },
  };
}
