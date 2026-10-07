import { icon } from '../lib/icons.js';

export function header() {
  const racha = Number(localStorage.getItem('latabla:racha') || 0);
  return `
  <header class="header">
    <button class="icon-btn" id="btn-menu" type="button" aria-label="Abrir menú de la sección" aria-controls="menu" aria-expanded="false">
      ${icon('menu', 24)}
    </button>
    <a href="/" data-link class="logo" aria-label="Latabla, ir al inicio"><span class="logo__la">LA</span>TABLA</a>
    <div class="racha" title="Días seguidos jugando">
      ${icon('flame', 15)}<span>Racha</span><strong>${racha}</strong>
    </div>
  </header>`;
}
