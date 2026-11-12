import { escudoMini } from '../lib/escudos.js';
import { tablaZona as tablaCargada } from '../lib/resultados.js';
import { PRIMERA_REAL, ANUAL_REAL, PROMEDIOS_REAL } from '../data/primera-real.js';
import { PRIMERA_EJEMPLO as D } from '../data/primera-ejemplo.js';
import { REGLAS, ordenarZona, ordenarAnual, ordenarPromedios, estadosCopas, crucesOctavos } from '../lib/reglas-primera.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';

const SIGLA = { lib: 'LIB', sud: 'SUD', 'desc-anual': 'DESC', 'desc-prom': 'PROM' };

let vista = 'posiciones';

// Promedio con 3 decimales; en el empate exacto redondea al par (52/64 = 0,8125 → 0,812), como la tabla oficial.
function formatoProm(pts, pj) {
  const milesimas = (pts * 1000) / pj;
  const base = Math.floor(milesimas);
  const resto = pts * 1000 - base * pj; // exacto, en enteros
  const redondeado = resto * 2 > pj || (resto * 2 === pj && base % 2 === 1) ? base + 1 : base;
  return (redondeado / 1000).toFixed(3);
}

function marca(estado) {
  return estado ? `<span class="marca marca--${estado.tipo}" title="${estado.detalle}">${SIGLA[estado.tipo]}</span>` : '';
}

function tablaZona(titulo, filas, estados) {
  return `
  <div class="placa-tabla">
    <h2 class="placa-tabla__titulo">${titulo}</h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta">
        <thead><tr><th class="num">#</th><th>Equipo</th><th class="num">PJ</th><th class="num">Pts</th></tr></thead>
        <tbody>
          ${filas.map((e, i) => `
          <tr class="${i < REGLAS.clasificanPorZona ? 'fila-clasifica' : ''} ${i === REGLAS.clasificanPorZona - 1 ? 'fila-corte' : ''} ${estados[e.id] ? 'fila--' + estados[e.id].tipo : ''}">
            <td class="num">${i + 1}</td>
            <td class="equipo"><span class="eq-celda">${escudoMini(e.id)}<a href="/equipo/${e.id}" data-link class="eq-link" title="${e.nombre}">${e.nombre}</a>${marca(estados[e.id])}</span></td>
            <td class="num num--sec">${e.pj}</td>
            <td class="num">${e.pts}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function tablaAnual(filas, estados) {
  return `
  <div class="placa-tabla">
    <h2 class="placa-tabla__titulo">Tabla anual <span class="fuente fuente--real">Al ${PRIMERA_REAL.actualizado}</span></h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta">
        <thead><tr><th class="num">#</th><th>Equipo</th><th class="num">PJ</th><th class="num">Pts</th></tr></thead>
        <tbody>
          ${filas.map((e, i) => `
          <tr class="${estados[e.id] ? 'fila--' + estados[e.id].tipo : ''}">
            <td class="num">${i + 1}</td>
            <td class="equipo"><span class="eq-celda">${escudoMini(e.id)}<a href="/equipo/${e.id}" data-link class="eq-link" title="${e.nombre}">${e.nombre}</a>${marca(estados[e.id])}</span></td>
            <td class="num num--sec">${e.pj}</td>
            <td class="num">${e.pts}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function referencias() {
  return `
  <ul class="referencias" aria-label="Referencias">
    <li><span class="marca marca--lib">LIB</span>Copa Libertadores</li>
    <li><span class="marca marca--sud">SUD</span>Copa Sudamericana</li>
    <li><span class="marca marca--desc-anual">DESC</span>Descenso por tabla anual</li>
    <li><span class="marca marca--desc-prom">PROM</span>Descenso por promedio</li>
    <li><span class="ref-corte"></span>Clasifican a octavos (8 por zona)</li>
  </ul>`;
}

function cruces(zA, zB) {
  return `
  <section class="cruces" aria-labelledby="t-cruces">
    <div class="cruces__cab">
      <h2 id="t-cruces" class="placa-tabla__titulo">Octavos de final</h2>
      <p>Así quedarían los cruces si la fase de zonas terminara hoy. Es local el mejor ubicado.</p>
    </div>
    <div class="cruces__llaves">
      ${crucesOctavos(zA, zB).map((ll) => `
        <div class="llave">
          <h3 class="llave__titulo">${ll.nombre}</h3>
          ${ll.partidos.map(([l, v]) => `
            <div class="cruce">
              <div class="cruce__eq"><span class="cruce__pos">${l.etiqueta}</span><span class="cruce__nombre">${l.nombre}</span><span class="cruce__pts">${l.pts}</span></div>
              <div class="cruce__eq"><span class="cruce__pos">${v.etiqueta}</span><span class="cruce__nombre">${v.nombre}</span><span class="cruce__pts">${v.pts}</span></div>
            </div>`).join('')}
        </div>`).join('')}
    </div>
  </section>`;
}

function promediosHtml(prom, estados) {
  return `
  <div class="placa-tabla placa-tabla--ancha">
    <h2 class="placa-tabla__titulo">Tabla de promedios <span class="fuente fuente--real">Al ${PRIMERA_REAL.actualizado}</span></h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta">
        <thead><tr><th class="num">#</th><th>Equipo</th><th class="num">PJ</th><th class="num">Pts</th><th class="num">Prom</th></tr></thead>
        <tbody>
          ${prom.map((e, i) => {
            const est = estados[e.id]?.tipo === 'desc-prom' ? estados[e.id] : null;
            return `
          <tr class="${est ? 'fila--desc-prom' : ''}">
            <td class="num">${i + 1}</td>
            <td class="equipo"><span class="eq-celda">${escudoMini(e.id)}<a href="/equipo/${e.id}" data-link class="eq-link" title="${e.nombre}">${e.nombre}</a>${marca(est)}</span></td>
            <td class="num num--sec">${e.pj}</td>
            <td class="num num--sec">${e.pts}</td>
            <td class="num">${formatoProm(e.pts, e.pj)}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function contenido() {
  const cA = tablaCargada('primera', 'A', D.zonaA), cB = tablaCargada('primera', 'B', D.zonaB);
  const zA = ordenarZona(cA.filas);
  const zB = ordenarZona(cB.filas);
  const anual = ordenarAnual(ANUAL_REAL);
  const prom = ordenarPromedios(PROMEDIOS_REAL);
  const estados = estadosCopas(anual, prom, PRIMERA_REAL.clasificadosPorTitulo);

  if (vista === 'promedios') return `${promediosHtml(prom, estados)}${referencias()}`;
  return `
    <div class="tres-tablas">
      ${tablaZona(`Zona A ${cA.etiqueta}`, zA, estados)}
      ${tablaZona(`Zona B ${cB.etiqueta}`, zB, estados)}
      ${tablaAnual(anual, estados)}
    </div>
    ${referencias()}
    ${cruces(zA, zB)}`;
}

function fechaActual() {
  const c = tablaCargada('primera', 'A', D.zonaA);
  return c.real ? Math.max(...c.filas.map((e) => e.pj)) : D.fecha;
}

function encabezadoDatos() {
  const c = tablaCargada('primera', 'A', D.zonaA);
  if (!c.real) return `<p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Zonas de ejemplo · tabla anual y promedios al ${PRIMERA_REAL.actualizado}</p>`;
  return `<p class="estado-datos"><span class="punto-vivo"></span>Zonas ${c.vivo ? 'en vivo (ESPN)' : 'cargadas a mano'} · tabla anual y promedios al ${PRIMERA_REAL.actualizado}</p>`;
}

export function primera() {
  return {
    titulo: 'Primera División · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--primera">
      <div class="tabla-pag__cab">
        ${encabezadoDatos()}
        <h1 class="titulo-grande">Primera División</h1>
        <p class="tabla-pag__torneo">Liga Profesional · ${D.torneo}, fecha ${fechaActual()}</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="pestanas" role="tablist" aria-label="Vista">
        <button role="tab" type="button" class="pestana" data-vista="posiciones">Posiciones</button>
        <button role="tab" type="button" class="pestana" data-vista="promedios">Promedios</button>
      </div>
      <div id="primera-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const pintar = () => {
        document.getElementById('primera-contenido').innerHTML = contenido();
        document.querySelectorAll('[data-vista]').forEach((b) => {
          const on = b.dataset.vista === vista;
          b.classList.toggle('activa', on);
          b.setAttribute('aria-selected', String(on));
        });
      };
      document.querySelectorAll('[data-vista]').forEach((b) =>
        b.addEventListener('click', () => { vista = b.dataset.vista; pintar(); })
      );
      pintar();
    },
  };
}
