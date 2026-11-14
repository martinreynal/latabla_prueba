// Penales Copa Argentina: elegís uno de los 64 clubes, se sortea el cuadro y jugás hasta seis tandas de penales.
// Este archivo solo ordena las pantallas. La lógica está en copa-logica.js y penales-logica.js,
// la tanda jugable en penales-tanda.js y el cuadro en copa-cuadro.js.
import { guardarEstado } from '../lib/progreso.js';
import { EQUIPOS_COPA, CATEGORIAS, equipoCopa } from '../data/copa-equipos.js';
import { RONDAS, nuevaCopa, cerrarRonda, partidoDe, rivalDe, cargarCopa, guardarCopa, borrarCopa } from './copa-logica.js';
import { htmlCuadro, activarCuadro, trofeo } from './copa-cuadro.js';
import { crearTanda } from './penales-tanda.js';
import { escudoHtml } from './penales-dibujo.js';

const fuerza = (id) => CATEGORIAS.find((c) => c.clave === equipoCopa(id).cat).fuerza;
const catCorta = (e) => CATEGORIAS.find((c) => c.clave === e.cat).corto;
const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const SORTEO = { entrada: 500, porCruce: 105, cierre: 1000 }; // 500 + 32 × 105 + 1000 = 4,9 s

export function montarPenales(raiz) {
  let copa = cargarCopa();
  let limpiarPantalla = () => {};
  let desmontado = false;

  function pantalla(html) {
    limpiarPantalla();
    limpiarPantalla = () => {};
    raiz.innerHTML = `<div class="copa">${html}</div>`;
    return raiz.firstElementChild;
  }
  const guardar = () => guardarCopa(copa);

  /* ---------- 1. Elegir equipo ---------- */
  function elegir() {
    const el = pantalla(`
      <h2 class="copa__tit">Elegí tu equipo</h2>
      <p class="copa__txt">Los 64 participantes de la Copa Argentina 2026. Vas a jugar con ese club toda la copa.</p>
      <label class="copa__buscar"><span>Buscar equipo</span><input type="search" id="copa-buscar" placeholder="Nombre del club" autocomplete="off"></label>
      ${CATEGORIAS.map((c) => `
        <section class="copa__cat" data-cat>
          <h3 class="copa__cat-tit">${c.nombre} <span>${EQUIPOS_COPA.filter((e) => e.cat === c.clave).length}</span></h3>
          <div class="pen__equipos">
            ${EQUIPOS_COPA.filter((e) => e.cat === c.clave).map((e) => `<button type="button" class="pen__equipo" data-eq="${e.id}" data-busca="${sinTilde(e.nombre)}">${escudoHtml(e)}<span>${e.nombre}</span></button>`).join('')}
          </div>
        </section>`).join('')}
      <p class="copa__txt" id="copa-nada" hidden>Ningún club coincide con la búsqueda.</p>`);
    el.querySelector('#copa-buscar').addEventListener('input', (ev) => {
      const q = sinTilde(ev.target.value.trim());
      let alguno = false;
      el.querySelectorAll('[data-cat]').forEach((sec) => {
        let visibles = 0;
        sec.querySelectorAll('[data-eq]').forEach((b) => { const ok = b.dataset.busca.includes(q); b.hidden = !ok; if (ok) visibles++; });
        sec.hidden = !visibles;
        alguno = alguno || visibles > 0;
      });
      el.querySelector('#copa-nada').hidden = alguno;
    });
    el.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => {
      copa = nuevaCopa(b.dataset.eq, EQUIPOS_COPA); // el sorteo queda resuelto acá; la animación solo lo muestra
      guardar();
      sorteo();
    }));
  }

  /* ---------- 2. Sorteo animado (menos de 5 segundos) ---------- */
  function sorteo() {
    const cruces = copa.rondas[0];
    const mio = partidoDe(copa, copa.equipo, 0).i;
    const par = (m, grande) => `${escudoHtml(equipoCopa(m.a), grande ? 'pen__escudo--grande' : '')}<span class="sorteo__vs">vs</span>${escudoHtml(equipoCopa(m.b), grande ? 'pen__escudo--grande' : '')}`;
    const el = pantalla(`
      <div class="sorteo">
        <h2 class="sorteo__tit">Sorteo Copa Argentina</h2>
        <div class="sorteo__bombo" aria-hidden="true">${EQUIPOS_COPA.map((e) => `<span data-b="${e.id}" class="${e.id === copa.equipo ? 'yo' : ''}">${escudoHtml(e)}</span>`).join('')}</div>
        <div class="sorteo__cruce" id="sorteo-cruce" aria-hidden="true"></div>
        <p class="sorteo__nombres" id="sorteo-nombres" role="status"></p>
        <div class="sorteo__grilla" aria-hidden="true">${cruces.map((m, i) => `<span class="sorteo__celda ${i === mio ? 'yo' : ''}" data-c="${i}">${par(m)}</span>`).join('')}</div>
        <button type="button" class="btn-categoria" id="sorteo-saltar">Saltar sorteo</button>
      </div>`);
    const t0 = performance.now();
    let mostrados = -1, raf = 0, hecho = false;
    function terminar() {
      if (hecho) return;
      hecho = true;
      cancelAnimationFrame(raf);
      copa.estado = 'cuadro';
      guardar();
      cuadro();
    }
    function paso(ahora) {
      if (desmontado || hecho) return;
      const t = ahora - t0 - SORTEO.entrada;
      const k = Math.min(31, Math.floor(t / SORTEO.porCruce));
      for (let i = mostrados + 1; i <= k; i++) {
        el.querySelector(`[data-c="${i}"]`).classList.add('lista');
        el.querySelector(`[data-b="${cruces[i].a}"]`).classList.add('salio');
        el.querySelector(`[data-b="${cruces[i].b}"]`).classList.add('salio');
      }
      const fin = t >= 32 * SORTEO.porCruce;
      const ver = fin ? mio : k;
      if (ver >= 0 && (ver !== mostrados || fin)) {
        const m = cruces[ver];
        el.querySelector('#sorteo-cruce').innerHTML = par(m, true);
        el.querySelector('#sorteo-cruce').classList.toggle('yo', fin || ver === mio);
        el.querySelector('#sorteo-nombres').textContent = fin ? `Tu cruce: ${equipoCopa(m.a).nombre} vs ${equipoCopa(m.b).nombre}` : `${equipoCopa(m.a).corto} vs ${equipoCopa(m.b).corto}`;
      }
      mostrados = Math.max(mostrados, k);
      if (t >= 32 * SORTEO.porCruce + SORTEO.cierre) return terminar();
      raf = requestAnimationFrame(paso);
    }
    // El final no depende de que el dispositivo llegue a dibujar todos los cuadros.
    const tope = setTimeout(terminar, SORTEO.entrada + 32 * SORTEO.porCruce + SORTEO.cierre + 300);
    el.querySelector('#sorteo-saltar').addEventListener('click', terminar);
    raf = requestAnimationFrame(paso);
    limpiarPantalla = () => { hecho = true; cancelAnimationFrame(raf); clearTimeout(tope); };
  }

  /* ---------- 3. Cuadro ---------- */
  function cuadro() {
    const yo = equipoCopa(copa.equipo);
    const enJuego = !!copa.partido;
    let cab;
    if (enJuego) {
      const rival = equipoCopa(rivalDe(partidoDe(copa, copa.equipo).m, copa.equipo));
      cab = `
        <div class="copa__proximo">
          <p class="copa__etiqueta">${RONDAS[copa.ronda]} · Tu partido</p>
          <p class="copa__cruce">${escudoHtml(yo)}<span>${yo.nombre}</span><em>vs</em><span>${rival.nombre}</span>${escudoHtml(rival)}</p>
          <p class="copa__txt">${rival.nombre} juega en ${CATEGORIAS.find((c) => c.clave === rival.cat).nombre}.</p>
          <button type="button" class="btn-principal" id="copa-jugar">Jugar mi partido</button>
        </div>`;
    } else if (copa.estado === 'campeon') {
      cab = `<div class="copa__proximo"><p class="copa__etiqueta">Copa terminada</p><p class="copa__cruce">${escudoHtml(yo)}<span>${yo.nombre}, campeón de la Copa Argentina 2026</span></p></div>`;
    } else {
      const m = partidoDe(copa, copa.equipo, copa.eliminadoEn).m;
      cab = `<div class="copa__proximo"><p class="copa__etiqueta">Copa terminada</p><p class="copa__cruce">${escudoHtml(yo)}<span>${yo.nombre} quedó eliminado en ${RONDAS[copa.eliminadoEn].toLowerCase()} contra ${equipoCopa(rivalDe(m, copa.equipo)).nombre}</span></p></div>`;
    }
    const el = pantalla(`
      ${cab}
      <div class="copa__barra">
        <h2 class="copa__tit">Cuadro</h2>
        <div class="copa__zoom">
          <button type="button" class="btn-categoria" id="cz-menos" aria-label="Alejar">−</button>
          <button type="button" class="btn-categoria" id="cz-mas" aria-label="Acercar">+</button>
          <button type="button" class="btn-categoria" id="cz-centrar">Mi partido</button>
        </div>
      </div>
      <div class="cz__visor" id="cz-visor" tabindex="0" aria-label="Cuadro de la Copa Argentina. Se desplaza en las dos direcciones."><div class="cz__lienzo">${htmlCuadro(copa)}</div></div>
      <p class="copa__detalle" id="cz-detalle" role="status">Tocá un cruce para ver el detalle. El camino de ${yo.corto} está marcado en amarillo.</p>
      <div class="copa__pie"><button type="button" class="btn-categoria" id="copa-nueva">Nueva copa</button></div>`);
    const c = activarCuadro(el.querySelector('#cz-visor'), copa, (html) => { el.querySelector('#cz-detalle').innerHTML = html; });
    el.querySelector('#cz-mas').addEventListener('click', c.mas);
    el.querySelector('#cz-menos').addEventListener('click', c.menos);
    el.querySelector('#cz-centrar').addEventListener('click', c.centrar);
    el.querySelector('#copa-jugar')?.addEventListener('click', partido);
    // "Nueva copa" pide confirmación en el mismo botón si hay una copa en curso.
    const nueva = el.querySelector('#copa-nueva');
    nueva.addEventListener('click', () => {
      if (enJuego && !nueva.dataset.seguro) {
        nueva.dataset.seguro = '1';
        nueva.textContent = '¿Seguro? Se pierde esta copa. Tocá de nuevo para confirmar';
        nueva.classList.add('copa__peligro');
        return;
      }
      borrarCopa(); copa = null; elegir();
    });
  }

  /* ---------- 4. Mi partido ---------- */
  function partido() {
    const yo = equipoCopa(copa.equipo);
    const rival = equipoCopa(rivalDe(partidoDe(copa, copa.equipo).m, copa.equipo));
    copa.estado = 'jugando';
    guardar();
    const el = pantalla('<div id="copa-tanda"></div>');
    limpiarPantalla = crearTanda(el.querySelector('#copa-tanda'), {
      yo, rival, ronda: RONDAS[copa.ronda], esFinal: copa.ronda === RONDAS.length - 1, partido: copa.partido,
      alPatear: guardar, // cada penal queda guardado: al recargar, la tanda sigue donde estaba
      alTerminar() {
        cerrarRonda(copa, fuerza);
        guardar();
        if (copa.estado === 'cuadro') return cuadro();
        guardarEstado('penales', copa.estado === 'campeon' ? 'resuelto' : 'fallado');
        cierre();
      },
    });
  }

  /* ---------- 5. Eliminación o título ---------- */
  function cierre() {
    const yo = equipoCopa(copa.equipo);
    const botones = `<div class="copa__btns"><button type="button" class="btn-principal" id="copa-nueva">Nueva copa</button><button type="button" class="btn-categoria" id="copa-ver">Ver el cuadro</button></div>`;
    let el;
    if (copa.estado === 'campeon') {
      el = pantalla(`
        <div class="copa__final copa__final--campeon">
          <div class="copa__papeles" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.22}s;background:${[yo.c1, yo.c2, '#D6C34A'][i % 3]}"></i>`).join('')}</div>
          ${trofeo(120)}
          <p class="copa__etiqueta">Campeón · Copa Argentina 2026</p>
          ${escudoHtml(yo, 'copa__escudo-final')}
          <h2 class="copa__final-tit">${yo.nombre}</h2>
          <p class="copa__txt">Ganaste las seis tandas de penales. La copa es tuya.</p>
          ${botones}
        </div>`);
    } else {
      const m = partidoDe(copa, copa.equipo, copa.eliminadoEn).m;
      const rival = equipoCopa(rivalDe(m, copa.equipo));
      const soyA = m.a === copa.equipo;
      el = pantalla(`
        <div class="copa__final">
          <p class="copa__etiqueta copa__etiqueta--rojo">Eliminado · ${RONDAS[copa.eliminadoEn]}</p>
          ${escudoHtml(yo, 'copa__escudo-final')}
          <h2 class="copa__final-tit">${yo.nombre} quedó afuera</h2>
          <p class="copa__txt">${rival.nombre} (${catCorta(rival)}) te ganó ${soyA ? m.pen[1] : m.pen[0]} – ${soyA ? m.pen[0] : m.pen[1]} en los penales, después del ${m.ga} – ${m.gb} en los 90 minutos.</p>
          ${botones}
        </div>`);
    }
    el.querySelector('#copa-nueva').addEventListener('click', () => { borrarCopa(); copa = null; elegir(); });
    el.querySelector('#copa-ver').addEventListener('click', cuadro);
  }

  /* ---------- Arranque: retoma la copa guardada donde estaba ---------- */
  if (!copa) elegir();
  else if (copa.estado === 'jugando') partido();
  else if (copa.estado === 'eliminado' || copa.estado === 'campeon') cierre();
  else { copa.estado = 'cuadro'; guardar(); cuadro(); } // si se recargó durante el sorteo, va directo al cuadro ya sorteado

  function limpiar() { desmontado = true; limpiarPantalla(); }
  const obs = new MutationObserver(() => { if (!raiz.isConnected) { limpiar(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });
  return limpiar;
}
