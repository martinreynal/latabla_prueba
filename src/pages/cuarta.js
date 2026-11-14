import { REGIONES, REGIONAL_ACTUALIZADO } from '../data/regional-real.js';
import LLAVES from '../data/regional-llaves.json';
import { haceCuanto } from '../lib/vivo.js';
import { PRIMERAC, PRIMERAC_ACTUALIZADO, FINAL_C, REDUCIDO_C } from '../data/primerac-real.js';
import { escudoMini } from '../lib/escudos.js';
import { ordenar } from '../lib/reglas-federal.js';
import { tabla, leyenda, pestanas, selectorTorneo, cabecera, cruceHtml } from '../components/tablas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

let torneo = 'primerac';
let vistaC = 'posiciones';
let region = 0;
let vistaR = 'eliminatorias';

/* ---------- Primera C (datos reales, cargados a mano) ---------- */
const sitC = (pos, total) => (pos === 1 ? 'ascenso' : pos <= 7 ? 'reducido' : pos === total ? 'descenso' : 'neutro');
const eqLink = (e) => (e ? `${escudoMini(e.id)}<a href="/equipo/${e.id}" data-link class="eq-link">${e.nombre}</a>` : 'A confirmar');

function serieC(s, i) {
  const pend = !s.pasa;
  const lado = (e, g) => `<div class="serie__eq serie__eq--libre ${s.pasa && e && s.pasa.id === e.id ? 'serie__eq--gana' : ''}"><span class="cruce__nombre">${eqLink(e)}</span>${g != null ? `<span class="cruce__pts">${g}</span>` : ''}</div>`;
  const pie = s.pasa ? `Global <strong>${s.g1}–${s.g2}</strong> · pasa ${s.pasa.nombre}${s.g1 === s.g2 ? ' tras igualar la serie' : ''}`
    : s.g1 != null ? `En juego · global <strong>${s.g1}–${s.g2}</strong>` : 'Por jugar';
  return `<div class="serie ${pend ? 'serie--pend' : ''}"><span class="serie__n">Serie ${i + 1}</span>${lado(s.a, s.g1)}${lado(s.b, s.g2)}<p class="serie__global">${pie}</p></div>`;
}

function reducidoC() {
  const F = FINAL_C;
  const perdedor = F.ganador.id === F.a.id ? F.b : F.a;
  return `
  <section class="hoy">
    <div class="hoy__cab"><h2 class="hoy__titulo">Final por el 1.er ascenso</h2></div>
    <div class="final-asc">
      <div class="final-asc__marcador">
        <div class="final-asc__eq"><span class="final-asc__pos">1.º A</span><span class="final-asc__nombre">${F.a.nombre}</span></div>
        <span class="final-asc__vs">VS</span>
        <div class="final-asc__eq final-asc__eq--der"><span class="final-asc__pos">1.º B</span><span class="final-asc__nombre">${F.b.nombre}</span></div>
      </div>
      <div class="asc-chip">${icon('flame', 14)}${F.ganador.nombre} campeón · asciende a la Primera B</div>
      <p class="final-asc__pie">${perdedor.nombre} perdió la final y entró directo a las semifinales del Reducido.</p>
    </div>
  </section>
  ${REDUCIDO_C.map((r) => `
  <section class="hoy">
    <div class="hoy__cab"><h2 class="hoy__titulo">Reducido · ${r.ronda}</h2>${r.series.every((x) => x.pasa) ? '' : `<span class="provisorio">${r.series.every((x) => x.g1 == null) ? 'Por jugar' : 'En juego'}</span>`}</div>
    <div class="reducido__grilla">${r.series.map(serieC).join('')}</div>
  </section>`).join('')}
  <p class="aviso aviso--chico">El ganador del Reducido es el 2.º ascenso a la Primera B. En las series que terminaron igualadas, la captura indica quién pasó pero no cómo (penales o ventaja deportiva).</p>`;
}

function desafiliacion(A, B) {
  const ua = { ...A[A.length - 1], etiqueta: `${A.length}.º A` };
  const ub = { ...B[B.length - 1], etiqueta: `${B.length}.º B` };
  return `
  <section class="hoy hoy--rojo">
    <div class="hoy__cab"><h2 class="hoy__titulo">Partido por la desafiliación</h2><span class="provisorio">Resultado a confirmar</span></div>
    <p class="hoy__nota">Se enfrentan los últimos de cada zona.</p>
    <div class="reducido__grilla reducido__grilla--1">${cruceHtml('VS', ua, ub, false)}</div>
    <div class="desafil">
      <div class="desafil__caso desafil__caso--pierde"><strong>Pierde</strong>Queda desafiliado y pasa al Torneo Promocional Amateur.</div>
      <div class="desafil__caso"><strong>Gana</strong>Juega una promoción contra el campeón del Promocional Amateur para quedarse en la C.</div>
    </div>
  </section>`;
}

function vistaPrimeraC() {
  const A = PRIMERAC.A, B = PRIMERAC.B;
  const sit = (pos) => sitC(pos, 14);
  const ley = leyenda([['ascenso', '1.º · Final por el ascenso'], ['reducido', '2.º a 7.º · Reducido'], ['descenso', 'Último · partido por la desafiliación'], ['neutro', 'Sin definición']]);
  const tit = (z) => `${z} <span class="fuente fuente--real">Final · al ${PRIMERAC_ACTUALIZADO}</span>`;
  let cuerpo;
  if (vistaC === 'ascenso') cuerpo = reducidoC();
  else if (vistaC === 'desafiliacion') cuerpo = `${desafiliacion(A, B)}<div class="dos-tablas dos-tablas--margen">${tabla('Zona A · 10.º a 14.º', A, sit, { desde: 10, cortes: [13] })}${tabla('Zona B · 10.º a 14.º', B, sit, { desde: 10, cortes: [13] })}</div>`;
  else cuerpo = `${ley}<div class="dos-tablas">${tabla(tit('Zona A'), A, sit, { cortes: [1, 7, 13] })}${tabla(tit('Zona B'), B, sit, { cortes: [1, 7, 13] })}</div>`;
  return `
    <p class="formato-resumen"><strong>Dos zonas de 14.</strong> Todos contra todos a dos ruedas, más cruces interzonales. Dos ascensos a la Primera B y un partido por la desafiliación.</p>
    <p class="fase-actual">Fase regular: <strong>terminada</strong> · Reducido: <strong>cuartos de final</strong></p>
    ${pestanas([['posiciones', 'Posiciones'], ['ascenso', 'Final y Reducido'], ['desafiliacion', 'Desafiliación']], vistaC, 'data-vc')}
    ${cuerpo}`;
}

/* ---------- Regional Amateur (primera ronda real, transcripta) ---------- */
function serieRegional(s, i) {
  const fin = !!s.ganador;
  const gana = (lado) => (s.ganador === lado ? 'serie__eq--gana' : '');
  const lado = (nombre, g, l) => `<div class="serie__eq serie__eq--libre ${gana(l)}"><span class="cruce__nombre">${nombre ?? 'A confirmar'}</span>${g != null ? `<span class="cruce__pts">${g}</span>` : ''}</div>`;
  const [ga, gb] = s.global ?? [null, null];
  const partidos = s.partidos.map((p) => `${p.tipo}: ${p.local} ${p.gl ?? '–'}-${p.gv ?? '–'} ${p.visitante}${p.gl === null && p.estado && p.estado !== 'FINAL' ? ` (${p.estado})` : ''}`).join(' · ');
  const pie = fin ? `Global <strong>${ga}–${gb}</strong>${s.penales ? ` · penales ${s.penales[0]}–${s.penales[1]}` : ''} · pasa ${s.ganador === 'a' ? s.a : s.b}`
    : s.global ? `En juego · global <strong>${ga}–${gb}</strong>` : 'Por jugar';
  return `<div class="serie ${fin ? '' : 'serie--pend'}" title="${partidos.replace(/"/g, '&quot;')}">
    <span class="serie__n">Serie ${i + 1}</span>${lado(s.a, ga, 'a')}${lado(s.b, gb, 'b')}
    <p class="serie__global">${pie}</p>
    <p class="serie__rev">${partidos}</p></div>`;
}

function eliminatorias(reg) {
  const rondas = LLAVES.rondas.filter((r) => r.regiones[reg.nombre]?.length);
  if (!rondas.length) return '<p class="aviso">Todavía no hay rondas eliminatorias cargadas para esta región.</p>';
  return rondas.slice().reverse().map((r) => {
    const series = r.regiones[reg.nombre];
    const pend = series.filter((x) => !x.ganador).length;
    return `
    <section class="hoy">
      <div class="hoy__cab"><h2 class="hoy__titulo">${r.nombre}</h2>${pend ? `<span class="provisorio">${pend === series.length && !series.some((x) => x.global) ? 'Por jugar' : 'En juego'}</span>` : ''}</div>
      <div class="reducido__grilla">${series.map(serieRegional).join('')}</div>
    </section>`;
  }).join('') + `<p class="aviso aviso--chico">Resultados de Ascenso del Interior, actualizados automáticamente ${haceCuanto(LLAVES.actualizado)}. Los nombres de los clubes aparecen como los escribe la fuente.</p>`;
}

function vistaRegional() {
  const reg = REGIONES[region];
  const sit = (pos, e) => (e.pasa === 'tercera' ? 'ascenso' : e.pasa === 'segunda' ? 'reducido' : 'neutro');
  const ley = [];
  if (reg.tercera) ley.push(['ascenso', `Directo a la tercera ronda (${reg.tercera})`]);
  if (reg.segunda) ley.push(['reducido', `A la segunda ronda (${reg.segunda})`]);
  ley.push(['neutro', 'Eliminado']);
  return `
    <p class="formato-resumen"><strong>El torneo más grande del país.</strong> Organizado por el Consejo Federal para clubes que llegan desde las ligas del interior, dividido en ocho regiones. Da ascensos al Federal A 2027.</p>
    <div class="camino-simple" aria-label="Cómo se juega">
      <div class="camino-simple__paso"><strong>Primera ronda</strong><span>Zonas por región · terminada</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso camino-simple__paso--hecho"><strong>Rondas eliminatorias</strong><span>Mano a mano, ida y vuelta · en juego</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso"><strong>Final de cada región</strong><span>Etapa final nacional</span></div>
      <span class="camino-simple__fl">${icon('chevron', 16)}</span>
      <div class="camino-simple__paso camino-simple__paso--oro"><strong>Ascensos</strong><span>al Federal A 2027</span></div>
    </div>
    <div class="anios anios--regiones" role="tablist" aria-label="Región">
      ${REGIONES.map((r, i) => `<button type="button" role="tab" class="anio ${i === region ? 'activa' : ''}" aria-selected="${i === region}" data-region="${i}">${r.nombre}</button>`).join('')}
    </div>
    ${pestanas([['eliminatorias', 'Eliminatorias'], ['zonas', 'Primera ronda']], vistaR, 'data-vr')}
    ${vistaR === 'eliminatorias' ? eliminatorias(reg) : `
    <p class="fase-actual">Región ${reg.nombre}: <strong>${reg.zonas.length} zonas</strong> · ${reg.zonas.reduce((n, z) => n + z.tabla.length, 0)} equipos · tablas finales de la primera ronda</p>
    ${leyenda(ley)}
    <div class="cuatro-tablas cuatro-tablas--3">
      ${reg.zonas.map((z) => tabla(z.nombre, z.tabla, sit, { compacta: true, extra: [{ th: 'DG', td: (e) => (e.dg > 0 ? `+${e.dg}` : e.dg), opc: true }] })).join('')}
    </div>
    <p class="aviso aviso--chico">Datos de la primera ronda transcriptos de las tablas que publica Ascenso del Interior, al ${REGIONAL_ACTUALIZADO}. En algunas regiones también clasificaron los mejores segundos o terceros. </p>`}`;
}

export function cuarta(sub) {
  if (sub === 'regional-amateur') torneo = 'regional';
  if (sub === 'primera-c') torneo = 'primerac';
  return {
    titulo: 'Cuarta División · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--tercera">
      ${cabecera('Cuarta División', 'Temporada 2026 · Primera C para los clubes afiliados a AFA, Torneo Regional Federal Amateur para el interior', icon('menu', 18), `Datos reales · cargados al ${PRIMERAC_ACTUALIZADO}`)}
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
        cont.querySelectorAll('[data-vr]').forEach((b) => b.addEventListener('click', () => { vistaR = b.dataset.vr; pintar(); }));
        cont.querySelectorAll('[data-region]').forEach((b) => b.addEventListener('click', () => { region = Number(b.dataset.region); pintar(); }));
      };
      pintar();
    },
  };
}
