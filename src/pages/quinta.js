import { tablaZona as tablaCargada } from '../lib/resultados.js';
import { PROMOCIONAL as PR, PROVINCIAS, LIGAS_POR_PROVINCIA } from '../data/abajo-ejemplo.js';
import { ordenar } from '../lib/reglas-federal.js';
import { tabla, leyenda, selectorTorneo, cabecera } from '../components/tablas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

let torneo = 'promocional';
let provincia = null;
let liga = null;

function vistaPromocional() {
  const cA = tablaCargada('promocional', 'A', PR.A), cB = tablaCargada('promocional', 'B', PR.B);
  const A = ordenar(cA.filas), B = ordenar(cB.filas);
  const sit = (pos) => (pos === 1 ? 'ascenso' : pos <= 4 ? 'reducido' : 'neutro');
  const red = [...A.slice(1, 4).map((e, i) => ({ ...e, et: `${i + 2}.º A` })), ...B.slice(1, 4).map((e, i) => ({ ...e, et: `${i + 2}.º B` }))];
  return `
    <p class="formato-resumen"><strong>La puerta de entrada a AFA.</strong> Reemplazó a la Primera D en 2024. En 2026 son 17 equipos en dos zonas (8 y 9), todos contra todos a dos ruedas.</p>
    ${leyenda([['ascenso', '1.º · Final por el ascenso directo'], ['reducido', '2.º a 4.º · Reducido'], ['neutro', 'Sin definición']])}
    <div class="dos-tablas">${tabla(`Zona A ${cA.etiqueta}`, A, sit, { cortes: [1, 4] })}${tabla(`Zona B ${cB.etiqueta}`, B, sit, { cortes: [1, 4] })}</div>
    <section class="hoy">
      <div class="hoy__cab"><h2 class="hoy__titulo">Así se jugaría hoy</h2><span class="provisorio">Provisorio</span></div>
      <div class="final-asc">
        <p class="final-asc__etiqueta">Final por el ascenso directo <span>El ganador sube a la Primera C</span></p>
        <div class="final-asc__marcador">
          <div class="final-asc__eq"><span class="final-asc__pos">1.º A</span><span class="final-asc__nombre">${A[0].nombre}</span><span class="final-asc__pts">${A[0].pts} pts</span></div>
          <span class="final-asc__vs">VS</span>
          <div class="final-asc__eq final-asc__eq--der"><span class="final-asc__pos">1.º B</span><span class="final-asc__nombre">${B[0].nombre}</span><span class="final-asc__pts">${B[0].pts} pts</span></div>
        </div>
      </div>
      <div class="reducido">
        <h3 class="llave__titulo">Reducido · clasificados hoy</h3>
        <ul class="chips-eq">${red.map((e) => `<li><span class="cruce__pos">${e.et}</span>${e.nombre}</li>`).join('')}</ul>
        <p class="hoy__nota">El ganador del Reducido no sube directo: juega una promoción contra un equipo de la Primera C.</p>
      </div>
    </section>`;
}

function vistaLigas() {
  const ligas = provincia ? LIGAS_POR_PROVINCIA[provincia] || [] : [];
  const L = liga ? ligas.find((x) => x.id === liga) : null;
  return `
    <p class="formato-resumen"><strong>La base del fútbol del interior.</strong> Son las ligas locales afiliadas a través del Consejo Federal. Cada una organiza su propio campeonato y manda a sus mejores equipos al Torneo Regional Federal Amateur.</p>
    <div class="camino-simple" aria-label="Cómo se conectan">
      <div class="camino-simple__paso"><strong>Liga regional</strong><span>Torneo local de cada ciudad o zona</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso"><strong>Regional Federal Amateur</strong><span>1 o 2 equipos por liga, según su tamaño</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso camino-simple__paso--oro"><strong>Federal A</strong><span>4 ascensos por temporada</span></div>
    </div>
    <nav class="migas" aria-label="Ubicación">
      <button type="button" data-prov="">Argentina</button>
      ${provincia ? `<span>›</span><button type="button" data-liga="">${provincia}</button>` : ''}
      ${L ? `<span>›</span><strong>${L.nombre}</strong>` : ''}
    </nav>
    ${!provincia ? `
      <div class="provincias">
        ${PROVINCIAS.map(([reg, provs]) => `
          <section class="provincias__reg">
            <h3 class="llave__titulo">${reg}</h3>
            <div class="provincias__lista">
              ${provs.map((p) => {
                const n = (LIGAS_POR_PROVINCIA[p] || []).length;
                return `<button type="button" class="prov ${n ? '' : 'prov--vacia'}" data-prov="${p}"><strong>${p}</strong><small>${n ? `${n} ${n === 1 ? 'liga cargada' : 'ligas cargadas'}` : 'Sin ligas cargadas'}</small></button>`;
              }).join('')}
            </div>
          </section>`).join('')}
      </div>` : ''}
    ${provincia && !L ? (ligas.length ? `
      <div class="ligas-lista">
        ${ligas.map((x) => `<button type="button" class="prov" data-liga="${x.id}"><strong>${x.nombre}</strong><small>${x.tabla.length} equipos · datos de ejemplo</small></button>`).join('')}
      </div>` : `<p class="aviso">Todavía no cargamos las ligas de ${provincia}. Cuando estén en la base de datos, aparecen acá con sus tablas y campeonatos.</p>`) : ''}
    ${L ? `
      ${leyenda([['reducido', 'Plaza al Regional Federal Amateur (según la liga)'], ['neutro', 'Sin plaza']])}
      <div class="una-tabla">${tabla(L.nombre, ordenar(L.tabla), (pos) => (pos <= 2 ? 'reducido' : 'neutro'), { cortes: [2], goles: true })}</div>` : ''}`;
}

export function quinta(sub) {
  if (sub === 'ligas-regionales') torneo = 'ligas';
  if (sub === 'promocional-amateur') torneo = 'promocional';
  return {
    titulo: 'Quinta División · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--tercera">
      ${cabecera('Quinta División', 'Temporada 2026 · Promocional Amateur y ligas regionales', icon('menu', 18))}
      <div id="torneo-sel"></div>
      <div id="tercera-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const cont = document.getElementById('tercera-contenido');
      const sel = document.getElementById('torneo-sel');
      const pintar = () => {
        sel.innerHTML = selectorTorneo([['promocional', 'Torneo Promocional Amateur', 'Ascenso a la Primera C'], ['ligas', 'Ligas Regionales', 'Clasifican al Regional Amateur']], torneo);
        cont.innerHTML = torneo === 'ligas' ? vistaLigas() : vistaPromocional();
        cont.querySelectorAll('[data-prov]').forEach((b) => b.addEventListener('click', () => { provincia = b.dataset.prov || null; liga = null; pintar(); }));
        cont.querySelectorAll('[data-liga]').forEach((b) => b.addEventListener('click', () => { liga = b.dataset.liga || null; pintar(); }));
        sel.querySelectorAll('[data-torneo]').forEach((b) => b.addEventListener('click', () => irA(`/tablas/quinta/${b.dataset.torneo === 'ligas' ? 'ligas-regionales' : 'promocional-amateur'}`)));
      };
      pintar();
    },
  };
}
