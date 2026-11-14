// Copas CONMEBOL: Libertadores, Sudamericana y Recopa, con foco en los clubes argentinos.
import { COPAS_CONMEBOL as C, CONMEBOL_ACTUALIZADO } from '../data/conmebol.js';
import { abrirMenu } from '../components/menu.js';
import { pestanas } from '../components/tablas.js';
import { icon } from '../lib/icons.js';
import { irA } from '../data/estructura.js';

const ORDEN = [['libertadores', 'Libertadores'], ['sudamericana', 'Sudamericana'], ['recopa', 'Recopa']];
const ARG = new Set(['Estudiantes', 'Estudiantes de La Plata', 'Platense', 'Independiente Rivadavia', 'Rosario Central', 'Boca Juniors', 'River Plate', 'Tigre', 'Lanús', 'Racing Club', 'San Lorenzo', 'Argentinos Juniors', 'Deportivo Riestra', 'Barracas Central']);
const nom = (n) => (ARG.has(n) ? `${n}<abbr class="cm-arg" title="Club argentino">ARG</abbr>` : n);

function serie(x, i) {
  const lado = (n, g, gana) => `<div class="serie__eq serie__eq--libre ${gana ? 'serie__eq--gana' : ''}"><span class="cruce__nombre">${nom(n)}</span><span class="cruce__pts">${g}</span></div>`;
  const pasa = x.pasa === 1 ? x.a : x.b;
  return `<div class="serie ${ARG.has(x.a) || ARG.has(x.b) ? 'serie--arg' : ''}"><span class="serie__n">Serie ${i + 1}</span>
    ${lado(x.a, x.g1, x.pasa === 1)}${lado(x.b, x.g2, x.pasa === 2)}
    <p class="serie__global">Global <strong>${x.g1}–${x.g2}</strong>${x.pen ? ` · penales ${x.pen[0]}–${x.pen[1]}` : ''} · pasa ${pasa}</p></div>`;
}

function finalHtml(c) {
  const f = c.final;
  return `
  <section class="hoy cm-final">
    <div class="hoy__cab"><h2 class="hoy__titulo">Final</h2><span class="provisorio">${c.estado}</span></div>
    <div class="final-asc">
      <div class="final-asc__marcador">
        <div class="final-asc__eq"><span class="final-asc__nombre">${nom(f.a)}</span></div>
        <span class="final-asc__vs">VS</span>
        <div class="final-asc__eq final-asc__eq--der"><span class="final-asc__nombre">${nom(f.b)}</span></div>
      </div>
      <p class="final-asc__pie">${icon('calendar', 14)} ${f.fecha} · ${f.lugar}${f.partidoUnico ? ' · partido único' : ''}</p>
    </div>
  </section>`;
}

function argentinos(c) {
  return `
  <section class="placa-tabla">
    <h2 class="placa-tabla__titulo">Clubes argentinos en la ${c.edicion}</h2>
    <div class="tabla-scroll"><table class="tabla cm-tabla">
      <thead><tr><th>Club</th><th>Cómo clasificó</th><th>Hasta dónde llegó</th></tr></thead>
      <tbody>${c.argentinos.map(([club, como, hasta, nivel]) => `<tr class="cm-nivel--${nivel}"><td class="equipo">${club}</td><td class="num--sec">${como}</td><td>${hasta}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

function campeones(c) {
  return `
  <section class="cm-campeones">
    <h3 class="llave__titulo">Últimos campeones</h3>
    <ol class="cm-lista">${c.campeones.map(([a, eq]) => `<li><span>${a}</span>${nom(eq)}</li>`).join('')}</ol>
    ${c.titulosArgentinos ? `<p class="aviso aviso--chico">${c.titulosArgentinos}</p>` : ''}
  </section>`;
}

function vistaCopa(clave) {
  const c = C[clave];
  if (clave === 'recopa') {
    return `
      <p class="formato-resumen"><strong>${c.edicion}.</strong> ${c.resumen}</p>
      <section class="hoy cm-final">
        <div class="hoy__cab"><h2 class="hoy__titulo">${c.campeon} campeón</h2><span class="provisorio provisorio--ok">${c.estado}</span></div>
        <div class="reducido__grilla">
          ${c.partidos.map((p) => `
            <div class="serie"><span class="serie__n">${p.tipo}</span>
              <div class="serie__eq serie__eq--libre ${p.gl > p.gv ? 'serie__eq--gana' : ''}"><span class="cruce__nombre">${nom(p.local)}</span><span class="cruce__pts">${p.gl}</span></div>
              <div class="serie__eq serie__eq--libre ${p.gv > p.gl ? 'serie__eq--gana' : ''}"><span class="cruce__nombre">${nom(p.visitante)}</span><span class="cruce__pts">${p.gv}</span></div>
              <p class="serie__global">${p.lugar}${p.nota ? ` · ${p.nota}` : ''}</p>
            </div>`).join('')}
        </div>
        <p class="hoy__nota">${c.detalle}</p>
      </section>
      <div class="cm-pie">${campeones(c)}</div>`;
  }
  return `
    <p class="formato-resumen"><strong>${c.edicion}.</strong> ${c.resumen}</p>
    ${finalHtml(c)}
    <div class="cm-dos">
      ${argentinos(c)}
      ${campeones(c)}
    </div>
    ${c.cuadro.slice().reverse().map((r) => `
      <section class="hoy">
        <div class="hoy__cab"><h2 class="hoy__titulo">${r.ronda}</h2></div>
        <div class="reducido__grilla">${r.series.map(serie).join('')}</div>
      </section>`).join('')}
    <p class="aviso aviso--chico">ARG marca a los clubes argentinos y en amarillo va el que pasó de ronda. Las series se muestran con el resultado global.</p>`;
}

export function conmebol(sub) {
  const actual = C[sub] ? sub : 'libertadores';
  return {
    titulo: `${C[actual].nombre} · Copas CONMEBOL · Latabla`,
    html: `
    <section class="tabla-pag tabla-pag--conmebol">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo"></span>Datos reales · al ${CONMEBOL_ACTUALIZADO}</p>
        <h1 class="titulo-grande">Copas CONMEBOL</h1>
        <p class="tabla-pag__torneo">Libertadores, Sudamericana y Recopa: cómo les va a los clubes argentinos.</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      ${pestanas(ORDEN, actual, 'data-cm')}
      <div id="cm-contenido">${vistaCopa(actual)}</div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
      document.querySelectorAll('[data-cm]').forEach((b) => b.addEventListener('click', () => irA(`/tablas/conmebol/${b.dataset.cm}`)));
    },
  };
}
