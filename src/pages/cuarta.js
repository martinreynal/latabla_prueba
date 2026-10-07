import { tablaZona as tablaCargada } from '../lib/resultados.js';
import { PRIMERA_C as PC, REGIONAL } from '../data/abajo-ejemplo.js';
import { ordenar } from '../lib/reglas-federal.js';
import { tabla, leyenda, pestanas, selectorTorneo, cabecera, cruceHtml } from '../components/tablas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

let torneo = 'primerac';
let vistaC = 'posiciones';
let region = 0;

/* ---------- Primera C ---------- */
const sitC = (pos, total) => (pos === 1 ? 'ascenso' : pos <= 7 ? 'reducido' : pos === total ? 'descenso' : 'neutro');

function hoyPrimeraC(A, B) {
  const red = [...A.slice(1, 7).map((e, i) => ({ ...e, etiqueta: `${i + 2}.º A` })), ...B.slice(1, 7).map((e, i) => ({ ...e, etiqueta: `${i + 2}.º B` }))];
  return `
  <section class="hoy">
    <div class="hoy__cab"><h2 class="hoy__titulo">Así se jugaría hoy</h2><span class="provisorio">Provisorio</span></div>
    <div class="final-asc">
      <p class="final-asc__etiqueta">Final por el 1.er ascenso <span>Ida y vuelta · el ganador es campeón y sube a la Primera B</span></p>
      <div class="final-asc__marcador">
        <div class="final-asc__eq"><span class="final-asc__pos">1.º A</span><span class="final-asc__nombre">${A[0].nombre}</span><span class="final-asc__pts">${A[0].pts} pts</span></div>
        <span class="final-asc__vs">VS</span>
        <div class="final-asc__eq final-asc__eq--der"><span class="final-asc__pos">1.º B</span><span class="final-asc__nombre">${B[0].nombre}</span><span class="final-asc__pts">${B[0].pts} pts</span></div>
      </div>
      <p class="final-asc__pie">El perdedor de la final entra directo a las semifinales del Reducido.</p>
    </div>
    <div class="reducido">
      <h3 class="llave__titulo">Reducido por el 2.º ascenso · clasificados hoy</h3>
      <p class="hoy__nota">Del 2.º al 7.º de cada zona, doce equipos, más el perdedor de la final en semifinales.</p>
      <ul class="chips-eq">${red.map((e) => `<li><span class="cruce__pos">${e.etiqueta}</span>${e.nombre}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function desafiliacion(A, B) {
  const ua = { ...A[A.length - 1], etiqueta: `${A.length}.º A` };
  const ub = { ...B[B.length - 1], etiqueta: `${B.length}.º B` };
  return `
  <section class="hoy hoy--rojo">
    <div class="hoy__cab"><h2 class="hoy__titulo">Partido por la desafiliación</h2><span class="provisorio">Provisorio</span></div>
    <p class="hoy__nota">Se enfrentan los últimos de cada zona.</p>
    <div class="reducido__grilla reducido__grilla--1">${cruceHtml('VS', ua, ub, false)}</div>
    <div class="desafil">
      <div class="desafil__caso desafil__caso--pierde"><strong>Pierde</strong>Queda desafiliado y pasa al Torneo Promocional Amateur.</div>
      <div class="desafil__caso"><strong>Gana</strong>Juega una promoción contra el campeón del Promocional Amateur para quedarse en la C.</div>
    </div>
  </section>`;
}

function vistaPrimeraC() {
  const cA = tablaCargada('primerac', 'A', PC.A), cB = tablaCargada('primerac', 'B', PC.B);
  const A = ordenar(cA.filas), B = ordenar(cB.filas);
  const sit = (pos) => sitC(pos, 14);
  const ley = leyenda([['ascenso', '1.º · Final por el ascenso'], ['reducido', '2.º a 7.º · Reducido'], ['descenso', 'Último · partido por la desafiliación'], ['neutro', 'Sin definición']]);
  let cuerpo;
  if (vistaC === 'ascenso') cuerpo = `${hoyPrimeraC(A, B)}<div class="dos-tablas dos-tablas--margen">${tabla('Zona A · 1.º a 7.º', A, sit, { hasta: 7, cortes: [1] })}${tabla('Zona B · 1.º a 7.º', B, sit, { hasta: 7, cortes: [1] })}</div>`;
  else if (vistaC === 'desafiliacion') cuerpo = `${desafiliacion(A, B)}<div class="dos-tablas dos-tablas--margen">${tabla('Zona A · 10.º a 14.º', A, sit, { desde: 10, cortes: [13] })}${tabla('Zona B · 10.º a 14.º', B, sit, { desde: 10, cortes: [13] })}</div>`;
  else cuerpo = `<div class="dos-tablas">${tabla(`Zona A ${cA.etiqueta}`, A, sit, { cortes: [1, 7, 13] })}${tabla(`Zona B ${cB.etiqueta}`, B, sit, { cortes: [1, 7, 13] })}</div>${hoyPrimeraC(A, B)}`;
  return `
    <p class="formato-resumen"><strong>Dos zonas de 14.</strong> Todos contra todos a dos ruedas, más tres cruces interzonales por rueda. Dos ascensos a la Primera B y un partido por la desafiliación.</p>
    ${pestanas([['posiciones', 'Posiciones'], ['ascenso', 'Ascenso / Reducido'], ['desafiliacion', 'Desafiliación']], vistaC, 'data-vc')}
    ${ley}${cuerpo}`;
}

/* ---------- Regional Amateur ---------- */
function vistaRegional() {
  const reg = REGIONAL.regiones[region];
  return `
    <p class="formato-resumen"><strong>El torneo más grande del país.</strong> Organizado por el Consejo Federal para clubes que llegan desde las ligas regionales. Empezó el 30 de agosto y su etapa final está prevista para el 20 de diciembre. Da cuatro ascensos al Federal A 2027.</p>
    <div class="camino-simple" aria-label="Cómo se juega">
      <div class="camino-simple__paso"><strong>Zonas regionales</strong><span>Grupos chicos por cercanía</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso"><strong>Eliminatorias</strong><span>Mano a mano, ida y vuelta</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso"><strong>Etapa final</strong><span>8 equipos</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso camino-simple__paso--oro"><strong>4 ascensos</strong><span>al Federal A 2027</span></div>
    </div>
    <div class="anios" role="tablist" aria-label="Región">
      ${REGIONAL.regiones.map((r, i) => `<button type="button" role="tab" class="anio ${i === region ? 'activa' : ''}" aria-selected="${i === region}" data-region="${i}">${r.nombre}</button>`).join('')}
    </div>
    ${leyenda([['reducido', 'Pasa a la ronda eliminatoria'], ['neutro', 'Eliminado']])}
    <div class="cuatro-tablas cuatro-tablas--3">
      ${reg.zonas.map((z) => tabla(`${reg.nombre} · ${z.nombre}`, ordenar(z.tabla), (pos) => (pos <= 2 ? 'reducido' : 'neutro'), { cortes: [2], compacta: true })).join('')}
    </div>
    <p class="aviso aviso--chico">La cantidad de zonas y de clasificados por zona cambia según la región. En esta vista, pasan los dos primeros de cada zona.</p>`;
}

export function cuarta(sub) {
  if (sub === 'regional-amateur') torneo = 'regional';
  if (sub === 'primera-c') torneo = 'primerac';
  return {
    titulo: 'Cuarta División · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--tercera">
      ${cabecera('Cuarta División', 'Temporada 2026 · Primera C para los clubes afiliados a AFA, Torneo Regional Federal Amateur para el interior', icon('menu', 18))}
      <div id="torneo-sel"></div>
      <div id="tercera-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const cont = document.getElementById('tercera-contenido');
      const sel = document.getElementById('torneo-sel');
      const pintar = () => {
        sel.innerHTML = selectorTorneo([['primerac', 'Primera C', 'Clubes directamente afiliados'], ['regional', 'Torneo Regional Federal Amateur', 'Clubes de las ligas del interior']], torneo);
        cont.innerHTML = torneo === 'regional' ? vistaRegional() : vistaPrimeraC();
        sel.querySelectorAll('[data-torneo]').forEach((b) => b.addEventListener('click', () => irA(`/tablas/cuarta/${b.dataset.torneo === 'regional' ? 'regional-amateur' : 'primera-c'}`)));
        cont.querySelectorAll('[data-vc]').forEach((b) => b.addEventListener('click', () => { vistaC = b.dataset.vc; pintar(); }));
        cont.querySelectorAll('[data-region]').forEach((b) => b.addEventListener('click', () => { region = Number(b.dataset.region); pintar(); }));
      };
      pintar();
    },
  };
}
