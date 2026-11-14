import { icon } from '../lib/icons.js';
import { JUEGOS } from '../data/juegos.js';
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
        <p>${j.activo ? 'Este juego está en desarrollo.' : 'Este juego llega pronto.'}</p>
      </div>`}
    </section>`,
    montar() {
      if (JUGABLES[slug]) JUGABLES[slug](document.getElementById('juego-raiz'));
    },
  };
}
