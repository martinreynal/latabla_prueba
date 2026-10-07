import { tablaZona as tablaCargada } from '../lib/resultados.js';
import { BMETRO_EJEMPLO as BM, FEDERAL_EJEMPLO as FD } from '../data/tercera-ejemplo.js';
import { ordenar, federalCompleto, recorrido } from '../lib/reglas-federal.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

let torneo = 'bmetro';
let vistaB = 'posiciones';
let vistaF = 'mapa';
let equipoSel = null;

const signo = (n) => (n > 0 ? `+${n}` : `${n}`);
const flecha = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* Tabla genérica con situación por fila */
function tabla(titulo, filas, situacionDe, { desde = 1, hasta = filas.length, cortes = [], extra } = {}) {
  const vis = filas.map((e, i) => ({ e, pos: i + 1 })).filter((f) => f.pos >= desde && f.pos <= hasta);
  return `
  <div class="placa-tabla">
    <h2 class="placa-tabla__titulo">${titulo}</h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta tabla--nacional">
        <thead><tr>
          <th class="num">#</th><th>Equipo</th><th class="num">PJ</th>
          <th class="num col-opc">G</th><th class="num col-opc">E</th><th class="num col-opc">P</th>
          <th class="num">DG</th><th class="num">Pts</th>${extra ? `<th class="num">${extra.th}</th>` : ''}
        </tr></thead>
        <tbody>
          ${vis.map(({ e, pos }) => `
          <tr class="sit--${situacionDe(pos, e)} ${cortes.includes(pos) ? 'fila-corte' : ''}">
            <td class="num"><span class="pos-box">${pos}</span></td>
            <td class="equipo"><a href="/equipo/${e.id}" data-link class="eq-link">${e.nombre}</a>${e.origen ? `<small class="origen">${e.origen}</small>` : ''}</td>
            <td class="num num--sec">${e.pj}</td>
            <td class="num num--sec col-opc">${e.pg}</td>
            <td class="num num--sec col-opc">${e.pe}</td>
            <td class="num num--sec col-opc">${e.pp}</td>
            <td class="num num--sec">${signo(e.dg)}</td>
            <td class="num">${e.pts}</td>${extra ? `<td class="num num--sec">${extra.td(e)}</td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function leyenda(items) {
  return `<ul class="leyenda" aria-label="Referencias de colores">${items.map(([c, t]) => `<li><span class="leyenda__muestra leyenda__muestra--${c}"></span>${t}</li>`).join('')}</ul>`;
}

function pestanas(opciones, activa, attr) {
  return `<div class="pestanas" role="tablist" aria-label="Vista">${opciones.map(([v, t]) =>
    `<button role="tab" type="button" class="pestana ${v === activa ? 'activa' : ''}" aria-selected="${v === activa}" ${attr}="${v}">${t}</button>`).join('')}</div>`;
}

/* ================= PRIMERA B METROPOLITANA ================= */
const RB = { reducidoDesde: 2, reducidoHasta: 9, descensos: 2 };

function sitB(pos, total) {
  if (pos === 1) return 'ascenso';
  if (pos >= RB.reducidoDesde && pos <= RB.reducidoHasta) return 'reducido';
  if (pos > total - RB.descensos) return 'descenso';
  return 'neutro';
}

function reducidoB(t) {
  const n = RB.reducidoHasta - RB.reducidoDesde + 1;
  const cl = t.slice(RB.reducidoDesde - 1, RB.reducidoHasta).map((e, i) => ({ ...e, etiqueta: `${i + RB.reducidoDesde}.º` }));
  const cruces = Array.from({ length: n / 2 }, (_, i) => [cl[i], cl[n - 1 - i]]);
  const c = t[0];
  return `
  <section class="hoy" aria-labelledby="t-redb">
    <div class="hoy__cab"><h2 id="t-redb" class="hoy__titulo">Así se jugaría hoy el Reducido</h2><span class="provisorio">Provisorio</span></div>
    <p class="hoy__nota">Cruces armados con las posiciones actuales. Cambian con cada fecha.</p>
    <div class="final-asc">
      <p class="final-asc__etiqueta">Ascenso directo · Campeón <span>1.º de la tabla general</span></p>
      <div class="asc-directo">
        <span class="final-asc__pos">1.º</span>
        <span class="final-asc__nombre">${c.nombre}</span>
        <span class="final-asc__pts">${c.pts} pts · ${t[0].pts - t[1].pts} de ventaja sobre el 2.º</span>
      </div>
    </div>
    <div class="reducido">
      <h3 class="llave__titulo">Reducido por el 2.º ascenso · Primera ronda</h3>
      <p class="hoy__nota">Del 2.º al 9.º, los ocho mejores detrás del campeón. Series de ida y vuelta; define de local el mejor ubicado (L).</p>
      <div class="reducido__grilla">
        ${cruces.map(([l, v], i) => `
          <div class="cruce cruce--provisorio">
            <span class="cruce__n">${i + 1}</span>
            <div class="cruce__eq"><span class="cruce__pos">${l.etiqueta}</span><span class="cruce__nombre">${l.nombre}<abbr class="cruce__local" title="Define de local">L</abbr></span><span class="cruce__pts">${l.pts}</span></div>
            <div class="cruce__eq"><span class="cruce__pos">${v.etiqueta}</span><span class="cruce__nombre">${v.nombre}</span><span class="cruce__pts">${v.pts}</span></div>
          </div>`).join('')}
      </div>
      <p class="aviso aviso--chico">Orden de cruces (2.º vs 9.º, 3.º vs 8.º…) y formato de semis y final: a confirmar con el reglamento oficial de la Primera B 2026.</p>
    </div>
  </section>`;
}

function descensoB(t) {
  const salvado = t[t.length - RB.descensos - 1];
  return `
  <section class="desc-resumen">
    <h2 class="hoy__titulo">Descenderían hoy a la Primera C</h2>
    <div class="desc-resumen__grilla desc-resumen__grilla--2">
      ${t.slice(-RB.descensos).map((e, i) => {
        const pos = t.length - RB.descensos + i + 1;
        const dif = salvado.pts - e.pts;
        return `<div class="desc-card"><span class="desc-card__pos">${pos}.º</span><span class="desc-card__nombre">${e.nombre}</span><span class="desc-card__dif"><strong>${dif}</strong> ${dif === 1 ? 'punto' : 'puntos'} debajo de ${salvado.nombre}</span></div>`;
      }).join('')}
    </div>
  </section>`;
}

function vistaBMetro() {
  const cT = tablaCargada('bmetro', 'U', BM.tabla);
  const t = ordenar(cT.filas);
  const sit = (pos) => sitB(pos, t.length);
  const cortes = [1, RB.reducidoHasta, t.length - RB.descensos];
  const ley = leyenda([['ascenso', '1.º · Campeón, asciende directo'], ['reducido', '2.º a 9.º · Reducido'], ['descenso', 'Descenso a Primera C'], ['neutro', 'Sin definición']]);
  let cuerpo;
  if (vistaB === 'reducido') cuerpo = `${reducidoB(t)}<div class="dos-tablas--margen">${tabla('Tabla general · 1.º a 9.º', t, sit, { hasta: 9, cortes })}</div>`;
  else if (vistaB === 'descenso') cuerpo = `${descensoB(t)}<div class="dos-tablas--margen">${tabla('Tabla general · 15.º a 22.º', t, sit, { desde: 15, cortes })}</div>`;
  else cuerpo = `<div class="una-tabla">${tabla(`Tabla general ${cT.etiqueta}`, t, sit, { cortes })}</div>${reducidoB(t)}`;
  return `
    <p class="formato-resumen"><strong>Liga tradicional.</strong> 22 equipos, todos contra todos a dos ruedas, 42 fechas y una sola tabla.</p>
    ${pestanas([['posiciones', 'Posiciones'], ['reducido', 'Reducido'], ['descenso', 'Descenso']], vistaB, 'data-vb')}
    ${ley}
    ${cuerpo}`;
}

/* ================= FEDERAL A ================= */
function mapaFederal(F) {
  const B = (id, x, y, t, s, tipo) => `
    <g class="fnodo fnodo--${tipo}" data-f="${id}">
      <rect x="${x}" y="${y}" width="160" height="56" rx="3"/>
      <rect class="nodo__brillo" x="${x + 1}" y="${y + 1}" width="158" height="1"/>
      <text class="fnodo__t" x="${x + 80}" y="${y + 24}" text-anchor="middle">${t}</text>
      <text class="fnodo__s" x="${x + 80}" y="${y + 41}" text-anchor="middle">${s}</text>
    </g>`;
  const A = (d, cls = '') => `<path class="farista ${cls}" d="${d}" marker-end="url(#fpunta)"/>`;
  const L = (x, y, t, anchor = 'middle') => `<text class="flabel" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  const fase = FD.estado;
  const act = (id) => (id === fase ? 'actual' : '');
  return `
  <section class="mapa" aria-labelledby="t-fmapa">
    <div class="mapa__cab">
      <h2 id="t-fmapa" class="hoy__titulo">Mapa del torneo</h2>
      <p class="hoy__nota">Dos caminos al ascenso. A la izquierda, el principal; a la derecha, la Reválida, donde entran los que quedan en el camino. Perder una serie no siempre es quedar eliminado.</p>
    </div>
    <div class="mapa__lienzo mapa__lienzo--federal">
      <svg viewBox="0 0 370 626" role="img" aria-label="Mapa de fases del Federal A 2026">
        <defs>
          <linearGradient id="fg-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7D6E9A"/><stop offset=".5" stop-color="#6E5F8B"/><stop offset="1" stop-color="#54476E"/></linearGradient>
          <linearGradient id="fg-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2C33"/><stop offset="1" stop-color="#1C1B1F"/></linearGradient>
          <marker id="fpunta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker>
        </defs>
        ${L(90, 8, 'CAMINO PRINCIPAL')}${L(280, 8, 'REVÁLIDA')}
        ${B('pf', 10, 16, 'PRIMERA FASE', '37 equipos · 4 zonas', 'main')}
        ${B('desc', 200, 16, '4 DESCENSOS', '2 por zona de la 1.ª etapa', 'desc')}
        ${B('sf', 10, 106, 'SEGUNDA FASE', '18 equipos · 2 zonas de 9', 'main ' + act('segunda'))}
        ${B('r1', 200, 106, '1.ª ETAPA', '19 equipos · 2 zonas', 'rev')}
        ${B('cf', 10, 196, 'CUARTOS', '8 equipos · ida y vuelta', 'main ' + act('tercera'))}
        ${B('r2', 200, 196, '2.ª ETAPA', '24 equipos · 12 series', 'rev')}
        ${B('sm', 10, 286, 'SEMIFINALES', '4 equipos · ida y vuelta', 'main ' + act('cuarta'))}
        ${B('r3', 200, 286, '3.ª ETAPA', '14 equipos · 7 series', 'rev')}
        ${B('fi', 10, 376, 'FINAL', 'Partido único · cancha neutral', 'main ' + act('final'))}
        ${B('r4', 200, 376, '4.ª ETAPA', '8 equipos · 4 series', 'rev')}
        ${B('as1', 10, 466, '1.ER ASCENSO', 'a Primera Nacional 2027', 'asc')}
        ${B('r5', 200, 466, '5.ª Y 6.ª ETAPA', 'Semis y final', 'rev')}
        ${B('as2', 200, 556, '2.º ASCENSO', 'a Primera Nacional 2027', 'asc')}
        ${A('M90 72 V104')}${L(96, 92, '1.º–5.º Z1 · 1.º–4.º Z2-4 · mejor 5.º', 'start')}
        ${A('M170 58 C185 58 185 120 198 128', 'farista--baja')}${L(178, 78, 'resto', 'start')}
        ${A('M280 106 V74', 'farista--desc')}
        ${A('M90 162 V194')}${L(96, 182, '1.º a 4.º', 'start')}
        ${A('M170 150 C185 150 185 212 198 218', 'farista--baja')}${L(174, 170, '5.º–9.º', 'start')}
        ${A('M280 162 V194')}${L(286, 182, '1.º a 5.º', 'start')}
        ${A('M90 252 V284')}${L(96, 272, 'ganadores', 'start')}
        ${A('M170 236 C184 236 184 232 198 232', 'farista--baja')}${L(174, 228, 'perd.', 'start')}
        ${A('M280 252 V284')}
        ${A('M90 342 V374')}
        ${A('M170 326 C184 326 184 322 198 322', 'farista--baja')}${L(174, 318, 'perd.', 'start')}
        ${A('M280 342 V374')}
        ${A('M90 432 V464', 'farista--oro')}${L(96, 452, 'ganador', 'start')}
        ${A('M170 416 C184 416 184 412 198 412', 'farista--baja')}${L(174, 408, 'perd.', 'start')}
        ${A('M280 432 V464')}
        ${A('M280 522 V554', 'farista--oro')}
      </svg>
    </div>
    <ul class="leyenda leyenda--mapa">
      <li><span class="leyenda__muestra leyenda__muestra--reducido"></span>Camino principal</li>
      <li><span class="leyenda__muestra leyenda__muestra--copa"></span>Reválida</li>
      <li><span class="leyenda__muestra leyenda__muestra--ascenso"></span>Ascenso</li>
      <li><span class="leyenda__muestra leyenda__muestra--descenso"></span>Descenso</li>
    </ul>
  </section>`;
}

function dondeEsta(F) {
  const todos = [1, 2, 3, 4].flatMap((z) => F.pf.tablas[z].map((e) => ({ ...e, z }))).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const pasos = equipoSel ? recorrido(F, equipoSel) : null;
  return `
  <section class="donde" aria-labelledby="t-donde">
    <h2 id="t-donde" class="hoy__titulo">¿Dónde está cada equipo?</h2>
    <label class="donde__label" for="sel-equipo">Elegí un club</label>
    <select id="sel-equipo" class="donde__select">
      <option value="">Elegí un club…</option>
      ${todos.map((e) => `<option value="${e.id}" ${e.id === equipoSel ? 'selected' : ''}>${e.nombre} (Zona ${e.z})</option>`).join('')}
    </select>
    ${pasos ? `
      <ol class="recorrido">
        ${pasos.map((p) => `
          <li class="recorrido__paso recorrido__paso--${p.tipo}">
            <span class="recorrido__fase">${p.fase}</span>
            <span class="recorrido__texto">${p.texto}</span>
          </li>`).join(`<li class="recorrido__flecha" aria-hidden="true">${flecha}</li>`)}
      </ol>` : '<p class="hoy__nota">Vas a ver su recorrido fase por fase y si sigue en carrera por algún ascenso.</p>'}
  </section>`;
}

function vistaPrimeraFase(F) {
  const sit = (z) => (pos, e) => (F.pf.clasifica(z, pos, e) ? 'reducido' : 'neutro');
  return `
    ${leyenda([['reducido', 'Pasa a la Segunda Fase'], ['neutro', 'Va a la Reválida']])}
    <p class="hoy__nota nota-mq">Pasan del 1.º al 5.º de la Zona 1 (10 equipos), del 1.º al 4.º de las zonas de 9 y el mejor 5.º de esas tres zonas. Este año fue <strong>${F.pf.mejorQuinto.nombre}</strong> (Zona ${F.pf.mejorQuinto.zona}).</p>
    <div class="cuatro-tablas">
      ${[1, 2, 3, 4].map((z) => tabla(`Zona ${z}`, F.pf.tablas[z], sit(z), { cortes: [z === 1 ? 5 : 4] })).join('')}
    </div>`;
}

function vistaSegundaFase(F) {
  const sit = (pos) => (pos <= 4 ? 'reducido' : 'neutro');
  return `
    ${leyenda([['reducido', '1.º a 4.º · Cuartos de final'], ['neutro', '5.º a 9.º · Reválida 2.ª etapa']])}
    <p class="hoy__nota nota-mq">Todos arrancan de cero y juegan una sola rueda. Debajo de cada nombre, cómo llegó.</p>
    <div class="dos-tablas">${tabla('Zona A', F.sf.A, sit, { cortes: [4] })}${tabla('Zona B', F.sf.B, sit, { cortes: [4] })}</div>`;
}

function vistaCampeonato(F) {
  const serie = (c) => `
    <div class="serie">
      <span class="serie__n">Serie ${c.n}</span>
      <div class="serie__eq ${c.ganador.id === c.mejor.id ? 'serie__eq--gana' : ''}"><span class="cruce__pos">${c.mejor.etiqueta}</span><span class="cruce__nombre">${c.mejor.nombre}</span></div>
      <div class="serie__eq ${c.ganador.id === c.peor.id ? 'serie__eq--gana' : ''}"><span class="cruce__pos">${c.peor.etiqueta}</span><span class="cruce__nombre">${c.peor.nombre}</span></div>
      <p class="serie__global">Global <strong>${c.global}</strong> · pasa ${c.ganador.nombre} ${c.criterio}</p>
      <p class="serie__det">Ida: ${c.ida}<br>Vuelta: ${c.vuelta}</p>
      <p class="serie__rev">${c.perdedor.nombre} sigue vivo en la Reválida (2.ª etapa).</p>
    </div>`;
  const q = F.cuartos;
  const pend = (a, b, label) => `
    <div class="serie serie--pend">
      <span class="serie__n">${label}</span>
      <div class="serie__eq"><span class="cruce__nombre">${a}</span></div>
      <div class="serie__eq"><span class="cruce__nombre">${b}</span></div>
      <p class="serie__global">Por jugar · ida y vuelta</p>
    </div>`;
  return `
    <p class="hoy__nota nota-mq">Desde acá se juega por eliminación directa. Si la serie termina igual en puntos y diferencia de gol, pasa el 1.º o 2.º de su zona de la Segunda Fase. Los perdedores no quedan afuera: pasan a la Reválida.</p>
    <div class="llaves">
      <div class="llaves__col"><h3 class="llave__titulo">Cuartos de final</h3>${q.map(serie).join('')}</div>
      <div class="llaves__col"><h3 class="llave__titulo">Semifinales</h3>
        ${pend(q[0].ganador.nombre, q[1].ganador.nombre, 'Semi 1')}
        ${pend(q[2].ganador.nombre, q[3].ganador.nombre, 'Semi 2')}
      </div>
      <div class="llaves__col"><h3 class="llave__titulo">Final</h3>
        ${pend('Ganador Semi 1', 'Ganador Semi 2', 'Partido único · neutral')}
        <div class="asc-chip">${icon('flame', 14)}El ganador asciende a Primera Nacional</div>
      </div>
    </div>`;
}

function vistaRevalida(F) {
  const r1 = F.r1;
  const sit = (pos, e) => (r1.descienden.has(e.id) ? 'descenso' : r1.pasan.has(e.id) ? 'reducido' : 'neutro');
  const promA = new Map(r1.promA.map((e) => [e.id, e.clave]));
  const ptsB = new Map(r1.ptsB.map((e) => [e.id, e.clave]));
  return `
    ${leyenda([['reducido', 'Pasa a la 2.ª etapa'], ['descenso', 'Desciende'], ['neutro', 'Termina su temporada']])}
    <p class="hoy__nota nota-mq">1.ª etapa: los 19 que no pasaron la Primera Fase, en dos zonas, una rueda desde cero. Descienden los dos de peor promedio de la Zona A y los dos con menos puntos de la Zona B, sumando Primera Fase y 1.ª etapa.</p>
    <div class="dos-tablas">
      ${tabla('Reválida · Zona A', r1.A, sit, { extra: { th: 'Prom', td: (e) => promA.get(e.id).toFixed(3) } })}
      ${tabla('Reválida · Zona B', r1.B, sit, { extra: { th: 'Acum', td: (e) => ptsB.get(e.id) } })}
    </div>
    <section class="hoy">
      <div class="hoy__cab"><h2 class="hoy__titulo">2.ª etapa: así se cruzan</h2><span class="provisorio">Por jugar</span></div>
      <p class="hoy__nota">24 equipos ordenados del 1 al 24: primero los perdedores de cuartos, después los 5.º a 9.º de la Segunda Fase y por último los clasificados de la 1.ª etapa. Se cruzan 1 vs 24, 2 vs 23 y así.</p>
      <div class="reducido__grilla">
        ${F.r2.cruces.map(([a, b]) => `
          <div class="cruce cruce--provisorio">
            <span class="cruce__n">${a.semilla}</span>
            <div class="cruce__eq"><span class="cruce__pos">#${a.semilla}</span><span class="cruce__nombre">${a.nombre}<small class="origen">${a.motivo}</small></span><span class="cruce__pts"></span></div>
            <div class="cruce__eq"><span class="cruce__pos">#${b.semilla}</span><span class="cruce__nombre">${b.nombre}<small class="origen">${b.motivo}</small></span><span class="cruce__pts"></span></div>
          </div>`).join('')}
      </div>
    </section>`;
}

function vistaFederal() {
  const F = federalCompleto(FD);
  let cuerpo;
  if (vistaF === 'primera') cuerpo = vistaPrimeraFase(F);
  else if (vistaF === 'segunda') cuerpo = vistaSegundaFase(F);
  else if (vistaF === 'campeonato') cuerpo = vistaCampeonato(F);
  else if (vistaF === 'revalida') cuerpo = vistaRevalida(F);
  else cuerpo = mapaFederal(F);
  return `
    <p class="formato-resumen"><strong>Torneo por etapas.</strong> Zonas regionales, reclasificación, eliminatorias y una Reválida paralela. Dos ascensos y cuatro descensos.</p>
    <p class="fase-actual">Fase en juego: <strong>Cuartos de final</strong> · Reválida: <strong>2.ª etapa</strong></p>
    ${pestanas([['mapa', 'Mapa'], ['primera', 'Primera Fase'], ['segunda', 'Segunda Fase'], ['campeonato', 'Fase Campeonato'], ['revalida', 'Reválida']], vistaF, 'data-vf')}
    <div class="fed-cuerpo">${cuerpo}</div>
    ${dondeEsta(F)}`;
}

/* ================= PÁGINA ================= */
function contenido() {
  return torneo === 'federal' ? vistaFederal() : vistaBMetro();
}

export function tercera(sub) {
  if (sub === 'federal-a') torneo = 'federal';
  if (sub === 'primera-b') torneo = 'bmetro';
  return {
    titulo: 'Tercera División · Latabla',
    html: `
    <section class="tabla-pag tabla-pag--tercera">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Datos de ejemplo</p>
        <h1 class="titulo-grande">Tercera División</h1>
        <p class="tabla-pag__torneo">Temporada 2026 · dos torneos en paralelo según la afiliación del club</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="selector-torneo" role="tablist" aria-label="Torneo">
        <button type="button" role="tab" data-torneo="bmetro"><strong>Primera B</strong><small>Clubes directamente afiliados</small></button>
        <button type="button" role="tab" data-torneo="federal"><strong>Federal A</strong><small>Clubes del interior</small></button>
      </div>
      <div id="tercera-contenido"></div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      const cont = document.getElementById('tercera-contenido');
      const pintar = () => {
        cont.innerHTML = contenido();
        document.querySelectorAll('[data-torneo]').forEach((b) => {
          const on = b.dataset.torneo === torneo;
          b.classList.toggle('activo', on);
          b.setAttribute('aria-selected', String(on));
        });
        cont.querySelectorAll('[data-vb]').forEach((b) => b.addEventListener('click', () => { vistaB = b.dataset.vb; pintar(); }));
        cont.querySelectorAll('[data-vf]').forEach((b) => b.addEventListener('click', () => { vistaF = b.dataset.vf; pintar(); }));
        const sel = cont.querySelector('#sel-equipo');
        if (sel) sel.addEventListener('change', () => {
          equipoSel = sel.value || null;
          pintar();
          document.getElementById('sel-equipo')?.focus();
        });
      };
      document.querySelectorAll('[data-torneo]').forEach((b) => b.addEventListener('click', () => irA(`/tablas/tercera/${b.dataset.torneo === 'federal' ? 'federal-a' : 'primera-b'}`)));
      pintar();
    },
  };
}
