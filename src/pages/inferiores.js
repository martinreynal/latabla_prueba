import { escudoMini } from '../lib/escudos.js';
import { AFA_DATOS, JUV, reserva, juveniles, generalJuveniles, fechasJuveniles, cruces } from '../lib/afa.js';
import { haceCuanto } from '../lib/vivo.js';
import { tabla, leyenda, pestanas } from '../components/tablas.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

const CATS = [
  ['reserva', 'Reserva'], ['cuarta', 'Cuarta'], ['quinta', 'Quinta'], ['sexta', 'Sexta'],
  ['septima', 'Séptima'], ['octava', 'Octava'], ['novena', 'Novena'], ['general', 'General'], ['fecha', 'Fecha'],
];
const NOMBRE = { cuarta: 'Cuarta', quinta: 'Quinta', sexta: 'Sexta', septima: 'Séptima', octava: 'Octava', novena: 'Novena' };
let cat = 'general';
let abierto = null;
let faseRes = 'clausura';
let fechaSel = null;

const lista = (ns) => (ns.length > 2 && ns.every((n, i) => i === 0 || n === ns[i - 1] + 1) ? `${ns[0]} a ${ns[ns.length - 1]}`
  : ns.length > 1 ? `${ns.slice(0, -1).join(', ')} y ${ns[ns.length - 1]}` : `${ns[0] ?? ''}`);
function nota(cov, total) {
  const pub = `${lista(cov.fechas)}${cov.interzonal && !cov.fechaInterzonal ? ' e interzonal' : ''}${cov.fechaInterzonal ? ` (la ${cov.fechaInterzonal} fue la interzonal)` : ''}`;
  return `<p class="aviso aviso--chico">Tabla calculada por Latabla con los resultados que publicó la AFA: fechas ${pub}.${cov.faltan.length ? ` ${cov.faltan.length === 1 ? `Falta la fecha ${cov.faltan[0]}` : `Faltan las fechas ${lista(cov.faltan)}`}, que la AFA no publicó en su sitio.` : ''}</p>`;
}

/* ---------- Tabla general acumulada ---------- */
function acumulada() {
  const filas = generalJuveniles();
  const maxCat = Math.max(1, ...filas.flatMap((f) => JUV.map((c) => f.porCat[c])));
  const mejorCat = (f) => JUV.reduce((m, c) => (f.porCat[c] > f.porCat[m] ? c : m), JUV[0]);
  const peorCat = (f) => JUV.reduce((m, c) => (f.porCat[c] < f.porCat[m] ? c : m), JUV[0]);
  return `
    <p class="formato-resumen"><strong>Tabla General de Inferiores.</strong> Suma los puntos de cada club en las seis categorías juveniles, de Cuarta a Novena. Muestra qué institución tiene el trabajo de base más parejo. La Reserva no suma. Tocá un club para ver cómo se compone su total.</p>
    ${nota(juveniles('cuarta'))}
    <div class="gen">
      <div class="gen__cab" aria-hidden="true"><span>#</span><span>Club</span><span class="gen__c">PJ</span><span class="gen__tot">Pts</span></div>
      ${filas.map((f, i) => {
        const on = abierto === f.nombre;
        return `
        <div class="gen__fila ${i === 0 ? 'gen__fila--lider' : ''} ${on ? 'gen__fila--abierta' : ''}">
          <button type="button" class="gen__btn" data-club="${f.nombre}" aria-expanded="${on}">
            <span class="pos-box">${i + 1}</span>
            <span class="gen__nombre">${escudoMini(f.id)}${f.nombre}</span>
            <span class="gen__c">${f.pj}</span>
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
    const R = reserva(faseRes);
    const sel = `<div class="pestanas pestanas--chicas" role="tablist" aria-label="Torneo">${[['apertura', 'Apertura'], ['clausura', 'Clausura']].map(([v, t]) =>
      `<button role="tab" type="button" class="pestana ${v === faseRes ? 'activa' : ''}" aria-selected="${v === faseRes}" data-fase="${v}">${t}</button>`).join('')}</div>`;
    if (!R) return `${sel}<p class="aviso">Todavía no hay resultados publicados del ${faseRes === 'apertura' ? 'Apertura' : 'Clausura'}.</p>`;
    const zonas = Object.entries(R.zonas);
    const sit = (p) => (p === 1 ? 'ascenso' : 'neutro');
    return `
      <p class="formato-resumen"><strong>Reserva · Torneo Proyección.</strong> Las reservas de los clubes de la Liga Profesional, en dos zonas de 18 con Apertura y Clausura, como la Primera.</p>
      ${sel}
      ${leyenda([['ascenso', 'Puntero de la zona']])}
      <div class="${zonas.length > 1 ? 'dos-tablas' : 'una-tabla una-tabla--ancha'}">
        ${zonas.map(([z, filas], i) => tabla(zonas.length > 1 ? `Zona ${i + 1}` : 'Tabla', filas, sit, { extra: [{ th: 'DG', td: (e) => (e.dg > 0 ? `+${e.dg}` : e.dg), opc: true }] })).join('')}
      </div>
      ${nota(R)}
      <p class="aviso aviso--chico">Los números de zona son de Latabla: la AFA no los nombra en sus notas.</p>`;
  }
  const J = juveniles(c);
  return `
    <p class="formato-resumen"><strong>${NOMBRE[c]} división.</strong> 36 equipos, todos contra todos. Es campeón el que suma más puntos al final, sin playoffs.</p>
    ${leyenda([['ascenso', 'Puntero']])}
    <div class="una-tabla una-tabla--ancha">${tabla(`${NOMBRE[c]} división 2026`, J.filas, (p) => (p === 1 ? 'ascenso' : 'neutro'), { extra: [{ th: 'DG', td: (e) => (e.dg > 0 ? `+${e.dg}` : e.dg), opc: true }] })}</div>
    ${nota(J)}`;
}

/* ---------- Fecha: resultados agrupados por club ---------- */
function fecha() {
  const disponibles = fechasJuveniles();
  if (!disponibles.length) return '<p class="aviso">Todavía no hay fechas de juveniles publicadas.</p>';
  const n = disponibles.includes(fechaSel) ? fechaSel : disponibles[disponibles.length - 1];
  const partidos = cruces(n);
  return `
    <p class="formato-resumen"><strong>Fecha ${n}.</strong> Cada cruce entre dos clubes se juega en las seis categorías el mismo día: Cuarta, Quinta y Sexta en una cancha, y Séptima, Octava y Novena en la del rival. Tocá un cruce para ver las seis.</p>
    <label class="donde__label" for="sel-fecha">Fechas publicadas por la AFA</label>
    <select id="sel-fecha" class="donde__select">${disponibles.map((f) => `<option value="${f}" ${f === n ? 'selected' : ''}>Fecha ${f}</option>`).join('')}</select>
    <div class="fecha-lista">
      ${partidos.map((p) => {
        let g = 0, e = 0, pe = 0, pl = 0, pv = 0;
        JUV.forEach((c) => {
          if (!p.res[c]) return;
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
            <thead><tr><th>Categoría</th><th>Cancha</th><th class="num">${p.local}</th><th class="num">${p.visitante}</th></tr></thead>
            <tbody>
              ${JUV.map((c, i) => {
                const r = p.res[c];
                if (!r) return `<tr><td class="equipo">${NOMBRE[c]}</td><td class="num--sec">${i < 3 ? p.local : p.visitante}</td><td class="num" colspan="2">sin dato</td></tr>`;
                const [a, b] = r;
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
        <p class="estado-datos"><span class="punto-vivo"></span>Datos reales · AFA · actualizado ${haceCuanto(AFA_DATOS.actualizado)}</p>
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
        cont.querySelectorAll('[data-fase]').forEach((b) => b.addEventListener('click', () => { faseRes = b.dataset.fase; pintar(); }));
        cont.querySelector('#sel-fecha')?.addEventListener('change', (ev) => { fechaSel = +ev.target.value; pintar(); document.getElementById('sel-fecha')?.focus(); });
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
