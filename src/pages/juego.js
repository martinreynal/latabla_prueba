import { icon } from '../lib/icons.js';
import { JUEGOS } from '../data/juegos.js';
import { estadoJuego, guardarEstado } from '../lib/progreso.js';
import { montarPenales } from '../juegos/penales.js';

const JUGABLES = { penales: montarPenales };

export function juego(slug, navegar) {
  const j = JUEGOS.find((x) => x.slug === slug);
  if (!j) return null;

  return {
    titulo: `${j.titulo} · Latabla`,
    html: `
    <section class="juego-pag ${JUGABLES[slug] ? 'juego-pag--jugable' : ''}">
      <a href="/juegos" data-link class="volver">${icon('back', 18)}Volver a los juegos</a>
      <div class="juego-pag__cab">
        <span class="juego-pag__icono">${icon(j.icono, 34)}</span>
        <h1 class="titulo-grande">${j.titulo}</h1>
        <p>${j.descripcion}</p>
      </div>
      ${JUGABLES[slug] ? '<div id="juego-raiz"></div>' : `
      <div class="juego-pag__area">
        <p>${j.activo ? 'Acá va el juego. Lo construimos en el próximo paso.' : 'Este juego llega pronto.'}</p>
      </div>`}
      ${j.activo && !JUGABLES[slug] ? `
      <div class="modo-prueba">
        <p>Modo prueba: marcá un resultado para ver cómo cambia el cuadrante en la home.</p>
        <div class="modo-prueba__btns">
          <button type="button" data-estado="resuelto">Marcar resuelto</button>
          <button type="button" data-estado="fallado">Marcar fallado</button>
          <button type="button" data-estado="pendiente">Volver a pendiente</button>
        </div>
        <p class="modo-prueba__actual">Estado actual: <strong>${estadoJuego(j.slug)}</strong></p>
      </div>` : ''}
    </section>`,
    montar() {
      if (JUGABLES[slug]) JUGABLES[slug](document.getElementById('juego-raiz'));
      document.querySelectorAll('[data-estado]').forEach((b) =>
        b.addEventListener('click', () => { guardarEstado(j.slug, b.dataset.estado); navegar('/juegos'); })
      );
    },
  };
}
