import { buscarEquipo, fichaEquipo } from '../lib/equipos.js';
import { icon } from '../lib/icons.js';

const iniciales = (n) => n.replace(/^(Equipo|Club) /, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

export function equipo(id) {
  const eq = buscarEquipo(id);
  if (!eq) return null;
  const f = fichaEquipo(eq);
  const [c1, c2] = f.colores;
  const principal = eq.contextos[0];
  const texto = (hex) => (['#F1EFE8', '#D6B82E', '#6FA8DC'].includes(hex) ? '#111111' : '#FFFFFF');
  const totalGoles = f.plantel.flatMap((g) => g.jugadores).reduce((s, j) => s + j.goles, 0);
  const goleador = f.plantel.flatMap((g) => g.jugadores).sort((a, b) => b.goles - a.goles)[0];

  return {
    titulo: `${eq.nombre} · Latabla`,
    html: `
    <section class="perfil">
      <a href="${principal.ruta}" data-link class="volver">${icon('back', 18)}Volver a la tabla</a>
      <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Ficha y plantel de ejemplo</p>

      <header class="perfil__cab">
        <div class="perfil__escudo" style="--c1:${c1[1]};--c2:${c2[1]};--tx:${texto(c1[1])}" role="img" aria-label="Escudo de ${eq.nombre}">
          <span>${iniciales(eq.nombre)}</span>
        </div>
        <div class="perfil__id">
          <span class="perfil__cat">${principal.cat}</span>
          <h1 class="titulo-grande perfil__nombre">${eq.nombre}</h1>
          <p class="perfil__torneo">${principal.torneo}</p>
          <div class="perfil__colores">${f.colores.map(([n, h]) => `<span><i style="background:${h}"></i>${n}</span>`).join('')}</div>
        </div>
      </header>

      <dl class="ficha">
        <div><dt>Estadio</dt><dd>${f.estadio}</dd></div>
        <div><dt>Capacidad</dt><dd>${f.capacidad.toLocaleString('es-AR')}</dd></div>
        <div><dt>Ciudad</dt><dd>${f.ciudad}</dd></div>
        <div><dt>Fundación</dt><dd>${f.fundacion}</dd></div>
        <div><dt>Director técnico</dt><dd>${f.dt}</dd></div>
        <div><dt>Últimos 5</dt><dd class="forma">${f.forma.map((x) => `<span class="forma__${x}" title="${{ G: 'Ganó', E: 'Empató', P: 'Perdió' }[x]}">${x}</span>`).join('')}</dd></div>
      </dl>

      <section class="perfil__bloque">
        <h2 class="placa-tabla__titulo">En competencia</h2>
        <div class="contextos">
          ${eq.contextos.map((c) => `
            <a href="${c.ruta}" data-link class="contexto">
              ${c.pos ? `<span class="contexto__pos">${c.pos}.º</span>` : `<span class="contexto__pos contexto__pos--copa">${icon('grilla', 18)}</span>`}
              <span class="contexto__txt"><strong>${c.torneo}</strong><small>${c.pos ? `${c.pts} pts en ${c.pj} partidos · de ${c.total} equipos` : c.cat}</small></span>
              ${icon('chevron', 16)}
            </a>`).join('')}
        </div>
      </section>

      <section class="perfil__bloque">
        <div class="planilla__cab">
          <h2 class="placa-tabla__titulo">Planilla${f.juvenil ? ' · categoría juvenil' : ''}</h2>
          <p class="hoy__nota">${f.plantel.reduce((s, g) => s + g.jugadores.length, 0)} jugadores · ${totalGoles} goles · goleador: <strong>${goleador.nombre} (${goleador.goles})</strong></p>
        </div>
        <div class="tabla-scroll">
          <table class="tabla tabla--compacta planilla">
            <thead><tr><th class="num">N.º</th><th>Jugador</th><th class="num">Edad</th><th class="num">PJ</th><th class="num">Goles</th><th class="num col-opc">TA</th></tr></thead>
            ${f.plantel.map((g) => `
              <tbody>
                <tr class="planilla__grupo"><th colspan="6" scope="colgroup">${g.pos}</th></tr>
                ${g.jugadores.map((j) => `
                  <tr>
                    <td class="num">${j.dorsal}</td>
                    <td class="planilla__nombre">${j.nombre}</td>
                    <td class="num num--sec">${j.edad}</td>
                    <td class="num num--sec">${j.pj}</td>
                    <td class="num ${j.goles ? '' : 'num--sec'}">${j.goles}</td>
                    <td class="num num--sec col-opc">${j.ta}</td>
                  </tr>`).join('')}
              </tbody>`).join('')}
          </table>
        </div>
      </section>
      <p class="hist__pie">Los nombres de jugadores, la ficha y el escudo son de ejemplo. Con la base de datos, cada club carga su escudo, estadio y plantel reales.</p>
    </section>`,
  };
}
