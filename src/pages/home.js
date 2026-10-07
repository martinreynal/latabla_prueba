import { icon } from '../lib/icons.js';
import { JUEGOS } from '../data/juegos.js';
import { estadoJuego } from '../lib/progreso.js';

const ETIQUETA = { pendiente: 'Jugar', resuelto: 'Resuelto', fallado: 'Mañana otra', pronto: 'Pronto' };
const EMOJI = { pendiente: '⬜', resuelto: '🟩', fallado: '🟧', pronto: '⬛' };

function fechaDeHoy() {
  const f = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function estadoDe(j) {
  return j.activo ? estadoJuego(j.slug) : 'pronto';
}

export function home() {
  const activos = JUEGOS.filter((j) => j.activo);
  const jugados = activos.filter((j) => estadoDe(j) !== 'pendiente').length;

  const tiles = JUEGOS.map((j) => {
    const estado = estadoDe(j);
    const contenido = `
      <span class="tile__icono">${icon(j.icono, 26)}</span>
      <span class="tile__nombre">${j.nombre}</span>
      <span class="tile__estado">${ETIQUETA[estado]}</span>`;
    return j.activo
      ? `<a href="/juegos/${j.slug}" data-link class="tile tile--${estado}" aria-label="${j.nombre}, ${ETIQUETA[estado]}">${contenido}</a>`
      : `<div class="tile tile--pronto" aria-label="${j.nombre}, próximamente">${contenido}</div>`;
  }).join('');

  const barra = activos.map((j) => `<span class="progreso__seg progreso__seg--${estadoDe(j)}"></span>`).join('');

  return {
    titulo: 'Latabla · Juegos de fútbol argentino',
    html: `
    <section class="home">
      <div class="home__intro">
        <p class="home__fecha">${fechaDeHoy()}</p>
        <h1 class="titulo-grande">La tabla de hoy</h1>
        <p class="home__resumen"><strong>${jugados}/${activos.length}</strong> jugados. Se renueva a medianoche.</p>
        <div class="progreso" aria-hidden="true">${barra}</div>
        <button type="button" class="btn-principal" id="btn-compartir">${icon('share', 18)}Compartir mi tabla</button>
      </div>
      <div class="grilla-juegos">${tiles}</div>
    </section>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`,
    montar() {
      document.getElementById('btn-compartir').addEventListener('click', async () => {
        const filas = [0, 3, 6].map((i) => JUEGOS.slice(i, i + 3).map((j) => EMOJI[estadoDe(j)]).join('')).join('\n');
        const texto = `Latabla ${new Date().toLocaleDateString('es-AR')}\n${filas}\n${location.origin}`;
        try {
          if (navigator.share) await navigator.share({ text: texto });
          else { await navigator.clipboard.writeText(texto); avisar('Tabla copiada. Pegala donde quieras.'); }
        } catch { /* el usuario canceló */ }
      });
    },
  };
}

function avisar(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2400);
}
