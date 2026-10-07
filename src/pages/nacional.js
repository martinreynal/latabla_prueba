import { tablaZona as tablaCargada } from '../lib/resultados.js';
import { NACIONAL_EJEMPLO as D } from '../data/nacional-ejemplo.js';
import { REGLAS_NACIONAL as R, ordenarZona, situacion, primeraFaseReducido, finalPrimerAscenso } from '../lib/reglas-nacional.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';

let vista = 'posiciones';

const signo = (n) => (n > 0 ? `+${n}` : `${n}`);

function leyenda() {
  return `
  <ul class="leyenda" aria-label="Referencias de colores">
    <li><span class="leyenda__muestra leyenda__muestra--ascenso"></span>1.º · Final por el Primer Ascenso</li>
    <li><span class="leyenda__muestra leyenda__muestra--reducido"></span>2.º a 8.º · Reducido</li>
    <li><span class="leyenda__muestra leyenda__muestra--descenso"></span>Descenso</li>
    <li><span class="leyenda__muestra leyenda__muestra--neutro"></span>Sin definición</li>
  </ul>`;
}

function tabla(titulo, zona, desde = 1, hasta = zona.length) {
  const filas = zona.map((e, i) => ({ e, pos: i + 1 })).filter((f) => f.pos >= desde && f.pos <= hasta);
  return `
  <div class="placa-tabla">
    <h2 class="placa-tabla__titulo">${titulo}</h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta tabla--nacional">
        <thead><tr>
          <th class="num">#</th><th>Equipo</th><th class="num">PJ</th>
          <th class="num col-opc">G</th><th class="num col-opc">E</th><th class="num col-opc">P</th>
          <th class="num">DG</th><th class="num">Pts</th>
        </tr></thead>
        <tbody>
          ${filas.map(({ e, pos }) => {
            const s = situacion(pos, zona.length);
            const corte = pos === 1 || pos === R.reducidoHasta || pos === zona.length - R.descensosPorZona;
            return `
          <tr class="sit--${s} ${corte ? 'fila-corte' : ''}">
            <td class="num"><span class="pos-box">${pos}</span></td>
            <td class="equipo"><a href="/equipo/${e.id}" data-link class="eq-link">${e.nombre}</a></td>
            <td class="num num--sec">${e.pj}</td>
            <td class="num num--sec col-opc">${e.pg}</td>
            <td class="num num--sec col-opc">${e.pe}</td>
            <td class="num num--sec col-opc">${e.pp}</td>
            <td class="num num--sec">${signo(e.dg)}</td>
            <td class="num">${e.pts}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function equipoCruce(e, local) {
  return `
    <div class="cruce__eq">
      <span class="cruce__pos">${e.etiqueta}</span>
      <span class="cruce__nombre">${e.nombre}${local ? '<abbr class="cruce__local" title="Local">L</abbr>' : ''}</span>
      <span class="cruce__pts">${e.pts}</span>
    </div>`;
}

function asiSeJugariaHoy(A, B) {
  const [fa, fb] = finalPrimerAscenso(A, B);
  const reducido = primeraFaseReducido(A, B);
  return `
  <section class="hoy" aria-labelledby="t-hoy">
    <div class="hoy__cab">
      <h2 id="t-hoy" class="hoy__titulo">Así se jugaría hoy</h2>
      <span class="provisorio">Provisorio</span>
    </div>
    <p class="hoy__nota">Cruces armados con las posiciones actuales. Cambian con cada resultado.</p>

    <div class="final-asc">
      <p class="final-asc__etiqueta">Final por el Primer Ascenso <span>Partido único · estadio neutral</span></p>
      <div class="final-asc__marcador">
        <div class="final-asc__eq">
          <span class="final-asc__pos">1°A</span>
          <span class="final-asc__nombre">${fa.nombre}</span>
          <span class="final-asc__pts">${fa.pts} pts</span>
        </div>
        <span class="final-asc__vs">VS</span>
        <div class="final-asc__eq final-asc__eq--der">
          <span class="final-asc__pos">1°B</span>
          <span class="final-asc__nombre">${fb.nombre}</span>
          <span class="final-asc__pts">${fb.pts} pts</span>
        </div>
      </div>
      <p class="final-asc__pie">El ganador asciende a Primera División. El perdedor entra al Reducido en la segunda fase.</p>
    </div>

    <div class="reducido">
      <h3 class="llave__titulo">Reducido · Primera fase</h3>
      <p class="hoy__nota">Partido único en cancha del mejor ubicado (L). Si empatan, avanza el mejor ubicado.</p>
      <div class="reducido__grilla">
        ${reducido.map(([l, v], i) => `
          <div class="cruce cruce--provisorio">
            <span class="cruce__n">${i + 1}</span>
            ${equipoCruce(l, true)}
            ${equipoCruce(v, false)}
          </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function resumenDescenso(A, B) {
  const n = R.descensosPorZona;
  const linea = (z, letra) => {
    const salvado = z[z.length - n - 1];
    return z.slice(-n).map((e, i) => ({ e, pos: z.length - n + i + 1, letra, dif: salvado.pts - e.pts, salvado }));
  };
  const todos = [...linea(A, 'A'), ...linea(B, 'B')];
  return `
  <section class="desc-resumen" aria-labelledby="t-desc">
    <h2 id="t-desc" class="hoy__titulo">Descenderían hoy</h2>
    <div class="desc-resumen__grilla">
      ${todos.map(({ e, pos, letra, dif, salvado }) => `
        <div class="desc-card">
          <span class="desc-card__pos">${pos}°${letra}</span>
          <span class="desc-card__nombre">${e.nombre}</span>
          <span class="desc-card__dif"><strong>${dif}</strong> ${dif === 1 ? 'punto' : 'puntos'} debajo de ${salvado.nombre}</span>
        </div>`).join('')}
    </div>
    <p class="hoy__nota">Descienden los dos últimos de cada zona, cuatro en total.</p>
  </section>`;
}

function contenido() {
  const cA = tablaCargada('nacional', 'A', D.zonaA), cB = tablaCargada('nacional', 'B', D.zonaB);
  const A = ordenarZona(cA.filas);
  const B = ordenarZona(cB.filas);
  if (vista === 'ascenso') {
    return `${asiSeJugariaHoy(A, B)}
      <div class="dos-tablas dos-tablas--margen">${tabla('Zona A · 1.º a 8.º', A, 1, 8)}${tabla('Zona B · 1.º a 8.º', B, 1, 8)}</div>`;
  }
  if (vista === 'descenso') {
    const desde = A.length - 5;
    return `${resumenDescenso(A, B)}
      <div class="dos-tablas dos-tablas--margen">${tabla(`Zona A · ${desde}.º a ${A.length}.º`, A, desde)}${tabla(`Zona B · ${desde}.º a ${B.length}.º`, B, desde)}</div>`;
  }
  return `
    <div class="dos-tablas">${tabla(`Zona A ${cA.etiqueta}`, A)}${tabla(`Zona B ${cB.etiqueta}`, B)}</div>
    ${asiSeJugariaHoy(A, B)}`;
}

export function nacional() {
  return {
    titulo: 'Primera Nacional · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--nacional">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Datos de ejemplo</p>
        <h1 class="titulo-grande">Primera Nacional</h1>
        <p class="tabla-pag__torneo">Segunda División · Temporada 2026, fecha ${D.fecha}</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="pestanas" role="tablist" aria-label="Vista">
        <button role="tab" type="button" class="pestana" data-vista="posiciones">Posiciones</button>
        <button role="tab" type="button" class="pestana" data-vista="ascenso">Ascenso / Reducido</button>
        <button role="tab" type="button" class="pestana" data-vista="descenso">Descenso</button>
      </div>
      ${leyenda()}
      <div id="nacional-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const pintar = () => {
        document.getElementById('nacional-contenido').innerHTML = contenido();
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
