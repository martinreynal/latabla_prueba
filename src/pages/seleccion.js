// Selección Argentina: resumen. Se va a ampliar más adelante.
import { SELECCION as S } from '../data/seleccion.js';
import { icon } from '../lib/icons.js';

export function seleccion() {
  const res = (r) => { const [a, b] = r.split(' ')[0].split('-').map(Number); return a > b ? 'g' : a < b ? 'p' : 'e'; };
  return {
    titulo: 'Selección Argentina · Latabla',
    html: `
    <section class="tabla-pag sel">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo"></span>Resumen al ${S.actualizado}</p>
        <h1 class="titulo-grande">Selección Argentina</h1>
        <p class="tabla-pag__torneo">Director técnico: ${S.dt} · ${S.ranking.puesto}.º en el ranking FIFA (${S.ranking.puntos} pts, ${S.ranking.fecha}; 1.º ${S.ranking.primero})</p>
      </div>

      <div class="sel__datos">
        <div class="sel__dato"><span>Ranking FIFA</span><strong>${S.ranking.puesto}.º</strong><small>${S.ranking.puntos} pts</small></div>
        <div class="sel__dato"><span>Mundial 2026</span><strong>Subcampeón</strong><small>Final 0-1 con España</small></div>
        <div class="sel__dato"><span>Copas del Mundo</span><strong>3</strong><small>1978 · 1986 · 2022</small></div>
        <div class="sel__dato"><span>Copas América</span><strong>16</strong><small>Última: 2024</small></div>
      </div>

      <section class="hoy sel__proximo">
        <div class="hoy__cab"><h2 class="hoy__titulo">Próximo partido</h2><span class="provisorio">${S.proximo.tipo}</span></div>
        <p class="sel__vs">Argentina <em>vs</em> ${S.proximo.rival}</p>
        <p class="hoy__nota">${icon('calendar', 14)} ${S.proximo.fecha} · ${S.proximo.hora} · ${S.proximo.lugar}</p>
      </section>

      <div class="sel__dos">
        <section class="placa-tabla">
          <h2 class="placa-tabla__titulo">Últimos partidos</h2>
          <ul class="sel__partidos">
            ${S.ultimos.map(([f, rival, r, comp, det]) => `
              <li class="sel__partido sel__partido--${res(r)}">
                <span class="sel__fecha">${f}</span>
                <span class="sel__rival">Argentina <b>${r}</b> ${rival}</span>
                <span class="sel__comp">${comp}${det ? ` · ${det}` : ''}</span>
              </li>`).join('')}
          </ul>
        </section>
        <section class="placa-tabla">
          <h2 class="placa-tabla__titulo">${S.mundial.titulo}</h2>
          <p class="sel__texto">${S.mundial.texto}</p>
          <ol class="sel__camino">${S.mundial.camino.map(([fase, rival, r]) => `<li class="sel__partido--${res(r)}"><span>${fase}</span><strong>${rival}</strong><b>${r}</b></li>`).join('')}</ol>
        </section>
      </div>

      <section class="hoy">
        <div class="hoy__cab"><h2 class="hoy__titulo">El adiós de Messi</h2></div>
        <p class="hoy__nota">${S.messi}</p>
      </section>

      <section class="placa-tabla">
        <h2 class="placa-tabla__titulo">Palmarés</h2>
        <ul class="sel__palmares">${S.palmares.map(([t, n, d]) => `<li><strong>${n}</strong><span>${t}</span><small>${d}</small></li>`).join('')}</ul>
      </section>

      <p class="aviso aviso--chico">Sección en construcción: más adelante se suman plantel, fixture completo y estadísticas.</p>
    </section>`,
  };
}
