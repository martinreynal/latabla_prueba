// Piezas compartidas para pantallas de tablas.
const signo = (n) => (n > 0 ? `+${n}` : `${n}`);

export function tabla(titulo, filas, situacionDe = () => 'neutro', { desde = 1, hasta = filas.length, cortes = [], extra, compacta = false, goles = false } = {}) {
  const vis = filas.map((e, i) => ({ e, pos: i + 1 })).filter((f) => f.pos >= desde && f.pos <= hasta);
  const opc = compacta ? '' : '';
  return `
  <div class="placa-tabla">
    <h2 class="placa-tabla__titulo">${titulo}</h2>
    <div class="tabla-scroll">
      <table class="tabla tabla--compacta tabla--nacional">
        <thead><tr>
          <th class="num">#</th><th>Equipo</th><th class="num">PJ</th>
          ${compacta ? '' : '<th class="num col-opc">G</th><th class="num col-opc">E</th><th class="num col-opc">P</th>'}
          ${goles ? '<th class="num col-opc">GF</th><th class="num col-opc">GC</th>' : ''}<th class="num">DG</th><th class="num">Pts</th>${extra ? extra.map((x) => `<th class="num ${x.opc ? 'col-opc' : ''}">${x.th}</th>`).join('') : ''}
        </tr></thead>
        <tbody>
          ${vis.map(({ e, pos }) => `
          <tr class="sit--${situacionDe(pos, e)} ${cortes.includes(pos) ? 'fila-corte' : ''}">
            <td class="num"><span class="pos-box">${pos}</span></td>
            <td class="equipo"><a href="/equipo/${e.id}" data-link class="eq-link">${e.nombre}</a>${e.origen ? `<small class="origen">${e.origen}</small>` : ''}</td>
            <td class="num num--sec">${e.pj}</td>
            ${compacta ? '' : `<td class="num num--sec col-opc">${e.pg}</td><td class="num num--sec col-opc">${e.pe}</td><td class="num num--sec col-opc">${e.pp}</td>`}
            ${goles ? `<td class="num num--sec col-opc">${e.gf}</td><td class="num num--sec col-opc">${e.gc}</td>` : ''}<td class="num num--sec">${signo(e.dg)}</td>
            <td class="num">${e.pts}</td>${extra ? extra.map((x) => `<td class="num num--sec ${x.opc ? 'col-opc' : ''}">${x.td(e)}</td>`).join('') : ''}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>${opc}`;
}

export function leyenda(items) {
  return `<ul class="leyenda" aria-label="Referencias de colores">${items.map(([c, t]) => `<li><span class="leyenda__muestra leyenda__muestra--${c}"></span>${t}</li>`).join('')}</ul>`;
}

export function pestanas(opciones, activa, attr) {
  return `<div class="pestanas" role="tablist" aria-label="Vista">${opciones.map(([v, t]) =>
    `<button role="tab" type="button" class="pestana ${v === activa ? 'activa' : ''}" aria-selected="${v === activa}" ${attr}="${v}">${t}</button>`).join('')}</div>`;
}

export function selectorTorneo(opciones, activo) {
  return `<div class="selector-torneo" role="tablist" aria-label="Torneo">${opciones.map(([v, t, s]) =>
    `<button type="button" role="tab" class="${v === activo ? 'activo' : ''}" aria-selected="${v === activo}" data-torneo="${v}"><strong>${t}</strong><small>${s}</small></button>`).join('')}</div>`;
}

export function cabecera(titulo, sub, icono) {
  return `
  <div class="tabla-pag__cab">
    <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Datos de ejemplo</p>
    <h1 class="titulo-grande">${titulo}</h1>
    <p class="tabla-pag__torneo">${sub}</p>
    <button type="button" class="btn-categoria" id="btn-categoria">${icono}Cambiar categoría</button>
  </div>`;
}

export function cruceHtml(n, l, v, local = true) {
  const eq = (e, esLocal) => `<div class="cruce__eq"><span class="cruce__pos">${e.etiqueta}</span><span class="cruce__nombre">${e.nombre}${esLocal ? '<abbr class="cruce__local" title="Local en la definición">L</abbr>' : ''}</span><span class="cruce__pts">${e.pts ?? ''}</span></div>`;
  return `<div class="cruce cruce--provisorio"><span class="cruce__n">${n}</span>${eq(l, local)}${eq(v, false)}</div>`;
}
