// Penales Copa Argentina: elegís uno de los 64 clubes, se sortea el cuadro y jugás hasta seis tandas de penales.
// Este archivo solo ordena las pantallas. La lógica está en copa-logica.js y penales-logica.js,
// la tanda jugable en penales-tanda.js y el cuadro en copa-cuadro.js.
import { EQUIPOS_COPA, CATEGORIAS, equipoCopa } from '../data/copa-equipos.js';
import { generarNomina, easterEggDorsal } from './dorsales.js';
import { RONDAS, MONEDA, nuevaCopa, cerrarRonda, partidoDe, rivalDe, cargarCopa, guardarCopa, borrarCopa, elegirMoneda, aplicarDecision, falloEspecial } from './copa-logica.js';
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
    raiz.innerHTML = `<div class="copa-juego">${html}</div>`;
    raiz.dataset.pantalla = html.includes('cz-marco') ? 'cuadro' : html.includes('copa-tanda') ? 'tanda' : 'otra';
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
    const catDe = (e) => CATEGORIAS.find((c) => c.clave === e.cat).nombre;
    const lado = (e, der) => `
      <div class="copa-panel__eq ${der ? 'copa-panel__eq--der' : ''}">
        ${escudoHtml(e, 'copa-panel__escudo')}
        <div><strong>${e.nombre}</strong><small>${catDe(e)}</small></div>
      </div>`;
    let panel;
    if (enJuego) {
      const rival = equipoCopa(rivalDe(partidoDe(copa, copa.equipo).m, copa.equipo));
      panel = `
        <section class="copa-panel" aria-label="Tu próximo partido">
          <div class="copa-panel__ronda"><span>Tu partido</span><strong>${RONDAS[copa.ronda]}</strong><small>Ronda ${copa.ronda + 1} de ${RONDAS.length}</small></div>
          <div class="copa-panel__cruce">${lado(yo, false)}<span class="copa-panel__vs">VS</span>${lado(rival, true)}</div>
          <button type="button" class="btn-principal copa-panel__btn" id="copa-jugar">Jugar mi partido</button>
        </section>`;
    } else if (copa.estado === 'campeon') {
      panel = `<section class="copa-panel copa-panel--fin"><div class="copa-panel__ronda"><span>Copa terminada</span><strong>Campeón</strong></div><div class="copa-panel__cruce">${lado(yo, false)}</div><p class="copa-panel__txt">${yo.nombre}, campeón de la Copa Argentina 2026.</p></section>`;
    } else {
      const m = partidoDe(copa, copa.equipo, copa.eliminadoEn).m;
      const rival = equipoCopa(rivalDe(m, copa.equipo));
      panel = `<section class="copa-panel copa-panel--fin"><div class="copa-panel__ronda"><span>Copa terminada</span><strong>Eliminado</strong><small>${RONDAS[copa.eliminadoEn]}</small></div><div class="copa-panel__cruce">${lado(yo, false)}<span class="copa-panel__vs">VS</span>${lado(rival, true)}</div><p class="copa-panel__txt">${rival.nombre} te ganó en los penales.</p></section>`;
    }
    const el = pantalla(`
      ${panel}
      <section class="cz-marco" aria-label="Cuadro de la Copa Argentina">
        <div class="cz-barra">
          <h2 class="copa__tit">Cuadro</h2>
          <p class="cz-barra__detalle" id="cz-detalle" role="status">Tocá un cruce para ver el detalle · arrastrá para moverte · Ctrl + rueda para hacer zoom. El camino de ${yo.corto} va en amarillo.</p>
          <div class="cz-barra__zoom" role="group" aria-label="Zoom del cuadro">
            <button type="button" class="cz-btn" id="cz-menos" aria-label="Alejar">−</button>
            <span class="cz-barra__nivel" id="cz-nivel">100 %</span>
            <button type="button" class="cz-btn" id="cz-mas" aria-label="Acercar">+</button>
            <button type="button" class="cz-btn" id="cz-todo">Ver todo</button>
            <button type="button" class="cz-btn cz-btn--yo" id="cz-centrar">Mi partido</button>
          </div>
          <button type="button" class="cz-btn cz-btn--nueva" id="copa-nueva">Nueva copa</button>
        </div>
        <div class="cz__visor" id="cz-visor" tabindex="0" aria-label="Cuadro de la Copa Argentina. Se desplaza en las dos direcciones."><div class="cz__lienzo">${htmlCuadro(copa)}</div></div>
      </section>`);
    const c = activarCuadro(el.querySelector('#cz-visor'), copa, (html) => { el.querySelector('#cz-detalle').innerHTML = html; }, (z) => { el.querySelector('#cz-nivel').textContent = `${Math.round(z * 100)} %`; });
    el.querySelector('#cz-mas').addEventListener('click', c.mas);
    el.querySelector('#cz-menos').addEventListener('click', c.menos);
    el.querySelector('#cz-todo').addEventListener('click', c.todo);
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

  /* ---------- 3b. Sorteo de moneda antes de cada partido ---------- */
  function moneda(yo, rival) {
    const s = copa.partido.sorteo;
    const eq = (e) => `<span class="moneda__eq">${escudoHtml(e, 'pen__escudo--grande')}<strong>${e.nombre}</strong></span>`;
    const cab = `<p class="pen__capa-ronda">Copa Argentina · ${RONDAS[copa.ronda]}</p><p class="moneda__cruce">${yo.corto} <span>vs</span> ${rival.corto}</p>`;
    const disco = `<div class="moneda__aire"><div class="moneda__disco" id="moneda-disco"><span class="moneda__lado moneda__lado--cara"><b>CARA</b></span><span class="moneda__lado moneda__lado--cruz"><b>CRUZ</b></span></div></div><div class="moneda__sombra" id="moneda-sombra"></div>`;
    let reloj = 0, anims = [];
    limpiarYa();
    function limpiarYa() { clearTimeout(reloj); anims.forEach((a) => a.cancel()); anims = []; }
    const poner = (html) => { limpiarYa(); const el = pantalla(`<section class="moneda">${cab}${html}</section>`); limpiarPantalla = limpiarYa; return el; };

    function elegirLado() {
      const el = poner(`<h2 class="moneda__tit">Elegí cara o cruz</h2>${disco}
        <div class="moneda__btns"><button type="button" class="btn-principal" data-lado="cara">Cara</button><button type="button" class="btn-principal" data-lado="cruz">Cruz</button></div>
        <p class="copa__txt">El que gana el sorteo elige: patear primero o tener a su hinchada detrás del arco.</p>`);
      el.querySelectorAll('[data-lado]').forEach((b) => b.addEventListener('click', () => {
        elegirMoneda(s, b.dataset.lado);   // el resultado ya estaba sorteado: se guarda antes de animar
        guardar();
        lanzar();
      }));
    }
    function lanzar() {
      const el = poner(`<h2 class="moneda__tit">Elegiste ${s.coinChoice}</h2>${disco}<p class="copa__txt" role="status">La moneda está en el aire…</p>`);
      const d = el.querySelector('#moneda-disco'), aire = d.parentElement, sombra = el.querySelector('#moneda-sombra');
      const fin = 360 * 7 + (s.coinResult === 'cruz' ? 180 : 0);
      const T = MONEDA.duracion;
      if (!d.animate) { reloj = setTimeout(revelar, T); return; }
      // Sube frenándose, cae acelerando, rebota apenas y se asienta; el giro se va frenando hasta mostrar el resultado.
      anims = [
        aire.animate([
          { transform: 'translateY(0)', easing: 'cubic-bezier(.2,.7,.4,1)' },
          { transform: 'translateY(-150px)', offset: 0.42, easing: 'cubic-bezier(.6,0,.9,.4)' },
          { transform: 'translateY(0)', offset: 0.8, easing: 'ease-out' },
          { transform: 'translateY(-16px)', offset: 0.88, easing: 'ease-in' },
          { transform: 'translateY(0)', offset: 0.95 }, { transform: 'translateY(0)' }], { duration: T, fill: 'forwards' }),
        d.animate([{ transform: 'rotateX(0deg)' }, { transform: `rotateX(${fin}deg)` }], { duration: T * 0.95, easing: 'cubic-bezier(.25,.6,.3,1)', fill: 'forwards' }),
        sombra.animate([{ transform: 'scale(1)', opacity: 0.5 }, { transform: 'scale(.45)', opacity: 0.18, offset: 0.42 }, { transform: 'scale(1)', opacity: 0.5, offset: 0.8 }, { transform: 'scale(1)', opacity: 0.5 }], { duration: T, fill: 'forwards' }),
      ];
      reloj = setTimeout(revelar, T + 120);
    }
    const discoFijo = () => disco.replace('class="moneda__aire"', 'class="moneda__aire moneda__aire--quieta"').replace('class="moneda__disco"', `class="moneda__disco" style="transform:rotateX(${s.coinResult === 'cruz' ? 180 : 0}deg)"`);
    function revelar() {
      const salio = `<p class="moneda__salio">Salió <strong>${s.coinResult}</strong> · vos elegiste ${s.coinChoice}</p>`;
      if (s.tossWinner === 'yo') {
        if (s.decision) return resumen();
        const el = poner(`<h2 class="moneda__tit moneda__tit--bien">¡Ganaste el sorteo!</h2>${discoFijo()}${salio}
          <div class="moneda__opciones">
            <button type="button" class="moneda__opcion" data-dec="patear"><strong>Patear primero</strong></button>
            <button type="button" class="moneda__opcion" data-dec="lado"><strong>Elegir el lado</strong></button>
          </div>`);
        el.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => { aplicarDecision(s, 'yo', b.dataset.dec); guardar(); resumen(); }));
        el.querySelector('[data-dec]').focus({ preventScroll: true });
        return;
      }
      const el = poner(`<h2 class="moneda__tit moneda__tit--mal">Perdiste el sorteo</h2>${discoFijo()}${salio}
        <p class="moneda__decision"><strong>${rival.nombre}</strong> eligió ${s.decision === 'patear' ? 'patear primero' : 'el lado: va a tener a su hinchada detrás del arco'}.</p>
        <button type="button" class="btn-categoria" id="moneda-seguir">Seguir</button>`);
      el.querySelector('#moneda-seguir').addEventListener('click', resumen);
      reloj = setTimeout(resumen, MONEDA.avisoRival);   // la decisión del rival se muestra un momento y sigue sola
    }
    function resumen() {
      const primero = s.firstKicker === 'yo' ? yo : rival, tribuna = s.crowdTeam === 'yo' ? yo : rival;
      const nota = s.crowdTeam === 'yo'
        ? 'Tu hinchada va a estar detrás del arco: desde su quinto penal, el rival puede tirarla por arriba del travesaño.'
        : 'La tribuna es del rival: tu control de dirección se mueve un 30 % más rápido. La altura y la potencia no cambian.';
      const el = poner(`<h2 class="moneda__tit">Así se juega</h2>
        <div class="moneda__resumen">
          <div class="moneda__dato"><small>Patea primero</small>${eq(primero)}</div>
          <div class="moneda__dato"><small>Tribuna a favor</small>${eq(tribuna)}</div>
        </div>
        <p class="copa__txt moneda__nota">${nota}</p>
        <button type="button" class="btn-principal" id="moneda-jugar">Empezar la tanda</button>`);
      el.querySelector('#moneda-jugar').addEventListener('click', () => {
        copa.partido.primero = s.firstKicker;
        s.listo = true;
        guardar();
        partido();
      });
      el.querySelector('#moneda-jugar').focus({ preventScroll: true });
    }
    // Si se recargó a mitad del sorteo, se retoma donde estaba: la moneda no se vuelve a tirar.
    if (!s.coinChoice) elegirLado(); else if (!s.decision) revelar(); else resumen();
  }

  /* ---------- 4. Mi partido ---------- */
  function partido() {
    const yo = equipoCopa(copa.equipo);
    const rival = equipoCopa(rivalDe(partidoDe(copa, copa.equipo).m, copa.equipo));
    const s = copa.partido.sorteo;          // las copas guardadas antes del sorteo de moneda no lo tienen
    if (s && !s.listo) return moneda(yo, rival);
    // Copas guardadas antes de los dorsales: se arma la nómina ahora, una sola vez.
    if (!copa.partido.nominas) copa.partido.nominas = { yo: generarNomina(yo.id), rival: generarNomina(rival.id) };
    copa.estado = 'jugando';
    guardar();
    const el = pantalla('<div id="copa-tanda"></div>');
    limpiarPantalla = crearTanda(el.querySelector('#copa-tanda'), {
      yo, rival, ronda: RONDAS[copa.ronda], esFinal: copa.ronda === RONDAS.length - 1, partido: copa.partido,
      tribuna: s?.crowdTeam, cursor: s?.horizontalCursorSpeedMultiplier,
      falloRival: s ? (n) => { const f = falloEspecial(s, n); guardar(); return f; } : null,
      nominas: copa.partido.nominas,
      // Easter egg del dorsal del pateador rival: se sortea una vez por ejecución y queda guardado.
      eggRival(n, jugador) {
        const eggs = (copa.partido.eggs ??= {});
        if (!(n in eggs)) { eggs[n] = easterEggDorsal(jugador, 'rival'); guardar(); }
        return eggs[n];
      },
      // cada penal queda guardado: al recargar, la tanda sigue donde estaba
      alPatear() { if (s) s.penaltyNumberByTeam = { yo: copa.partido.mios.length, rival: copa.partido.suyos.length }; guardar(); },
      alTerminar() {
        cerrarRonda(copa, fuerza);
        guardar();
        if (copa.estado === 'cuadro') return cuadro();
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
