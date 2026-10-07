import { DIVISIONES } from '../data/divisiones.js';
import { abrirMenu } from '../components/menu.js';
import { icon } from '../lib/icons.js';

export function tabla(slug) {
  const div = DIVISIONES.find((d) => d.slug === slug);
  if (!div) return null;

  // Cuando conectemos el proveedor, estas filas vienen de Supabase.
  const filas = Array.from({ length: 12 }, (_, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td><span class="skeleton" style="width:${55 + ((i * 37) % 35)}%"></span></td>
      <td class="num"><span class="skeleton skeleton--corto"></span></td>
      <td class="num"><span class="skeleton skeleton--corto"></span></td>
      <td class="num"><span class="skeleton skeleton--corto"></span></td>
    </tr>`).join('');

  return {
    titulo: `${div.nombre} · Latabla`,
    html: `
    <section class="tabla-pag">
      <div class="tabla-pag__cab">
        <p class="estado-datos"><span class="punto-vivo punto-vivo--apagado"></span>Sin datos todavía</p>
        <h1 class="titulo-grande">${div.nombre}</h1>
        <p class="tabla-pag__torneo">${div.torneo}</p>
        <button type="button" class="btn-categoria" id="btn-categoria">${icon('menu', 18)}Cambiar categoría</button>
      </div>
      <div class="pestanas" role="tablist" aria-label="Vista de la tabla">
        <button role="tab" aria-selected="true" class="pestana activa">Posiciones</button>
        <button role="tab" aria-selected="false" class="pestana">Fecha en curso</button>
        <button role="tab" aria-selected="false" class="pestana">Goleadores</button>
      </div>
      <p class="aviso">Las posiciones aparecen acá cuando conectemos el proveedor de datos en vivo.</p>
      <div class="tabla-scroll">
        <table class="tabla">
          <thead><tr><th class="num">#</th><th>Equipo</th><th class="num">PJ</th><th class="num">DG</th><th class="num">Pts</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </section>`,
    montar() {
      document.getElementById('btn-categoria').addEventListener('click', abrirMenu);
    },
  };
}
