import { icon } from '../lib/icons.js';
import { JUEGOS } from '../data/juegos.js';

// Sección Juegos: todos los juegos disponibles para jugar y repetir libremente, sin registro de partidas.
export function home() {
  const tiles = JUEGOS.map((j) => {
    const contenido = `
      <span class="tile__icono">${icon(j.icono, 26)}</span>
      <span class="tile__nombre">${j.nombre}</span>
      <span class="tile__estado">${j.activo ? 'Jugar' : 'Pronto'}</span>`;
    return j.activo
      ? `<a href="/juegos/${j.slug}" data-link class="tile tile--pendiente" aria-label="Jugar ${j.nombre}">${contenido}</a>`
      : `<div class="tile tile--pronto" aria-label="${j.nombre}, próximamente">${contenido}</div>`;
  }).join('');

  return {
    titulo: 'Latabla · Juegos de fútbol argentino',
    html: `
    <section class="home">
      <div class="home__intro">
        <h1 class="titulo-grande">Juegos</h1>
        <p class="home__resumen">Minijuegos de fútbol argentino. Jugalos las veces que quieras.</p>
      </div>
      <div class="grilla-juegos">${tiles}</div>
    </section>`,
  };
}
