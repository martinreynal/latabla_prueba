import { icon } from '../lib/icons.js';

export function header() {
  return `
  <header class="header">
    <button class="icon-btn" id="btn-menu" type="button" aria-label="Abrir menú de la sección" aria-controls="menu" aria-expanded="false">
      ${icon('menu', 24)}
    </button>
    <a href="/" data-link class="logo" aria-label="Latabla, ir a la tabla de Primera"><span class="logo__la">LA</span>TABLA</a>
    <span class="header__equilibrio" aria-hidden="true"></span>
  </header>`;
}
