import './styles.css';
import { header } from './components/header.js';
import { menu, iniciarMenu, cerrarMenu, marcarRutaActiva } from './components/menu.js';
import { home } from './pages/home.js';
import { tabla } from './pages/tabla.js';
import { primera } from './pages/primera.js';
import { nacional } from './pages/nacional.js';
import { copas } from './pages/copas.js';
import { tercera } from './pages/tercera.js';
import { copaArgentina } from './pages/copa-argentina.js';
import { cuarta } from './pages/cuarta.js';
import { quinta } from './pages/quinta.js';
import { inferiores } from './pages/inferiores.js';
import { equipo } from './pages/equipo.js';
import { admin } from './pages/admin.js';
import { cargarPartidos } from './lib/resultados.js';
import { juego } from './pages/juego.js';
import './lib/supabase.js';

const app = document.getElementById('app');
app.innerHTML = `${header()}${menu()}<main id="vista" class="vista" tabindex="-1"></main>`;
iniciarMenu();

const vista = document.getElementById('vista');

// En la vista previa del chat usamos rutas con # (ej. #/tablas/primera),
// porque ahí no hay servidor que redirija las rutas. En el sitio real, rutas normales.
const HASH = import.meta.env.MODE === 'artifact';
const rutaActual = () =>
  (HASH ? location.hash.slice(1) : location.pathname).replace(/\/+$/, '') || '/';

function simple(titulo, texto) {
  return {
    titulo: `${titulo} · Latabla`,
    html: `<section class="simple"><h1 class="titulo-grande">${titulo}</h1><p>${texto}</p><a href="/" data-link class="btn-principal">Ir a la tabla de hoy</a></section>`,
  };
}

function resolver(path) {
  if (path === '/') return home();
  let m;
  if ((m = path.match(/^\/tablas\/([\w-]+)(?:\/([\w-]+))?$/))) {
    const [, g, sub] = m;
    const paginas = { primera, segunda: nacional, tercera, cuarta, quinta, 'copa-argentina': copaArgentina, copas, inferiores };
    if (paginas[g]) return paginas[g](sub);
  }
  if ((m = path.match(/^\/tablas\/([\w-]+)$/))) return tabla(m[1]);
  if (path === '/admin') return admin();
  if ((m = path.match(/^\/equipo\/([\w-]+)$/))) return equipo(m[1]);
  if ((m = path.match(/^\/juegos\/([\w-]+)$/))) return juego(m[1], navegar);
  if (path === '/rachas') return simple('Mis rachas', 'Cuando creemos las cuentas, acá vas a ver tus rachas y tu historial.');
  if (path === '/como-se-juega') return simple('Cómo se juega', 'Cada día hay un desafío nuevo en cada juego. Resolvelos y compartí tu tabla.');
  return null;
}

function rutear() {
  const path = rutaActual();
  const pagina = resolver(path) || simple('Página no encontrada', 'Esa dirección no existe. Volvé a la tabla para seguir jugando.');
  vista.innerHTML = pagina.html;
  document.title = pagina.titulo;
  pagina.montar?.();
  marcarRutaActiva(path);
  window.scrollTo(0, 0);
}

export function navegar(ruta) {
  if (HASH) { if (ruta !== rutaActual()) history.pushState({}, '', '#' + ruta); }
  else if (ruta !== location.pathname) history.pushState({}, '', ruta);
  cerrarMenu();
  rutear();
  vista.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  navegar(a.getAttribute('href'));
});

window.addEventListener('popstate', rutear);
document.addEventListener('latabla:navegar', (e) => navegar(e.detail));
if (HASH) window.addEventListener('hashchange', rutear);
cargarPartidos().catch(() => {}).finally(rutear);
