// Una tanda de penales jugable: el usuario patea con tres controles y ataja adivinando el sector.
// No sabe nada de la copa: recibe los dos equipos, el empate de los 90' y quién patea primero.
import { ARCO, ARCO_CX, destino, clasificar, centroZona, zonaDe, probAtajada, arqueroIA, remateRival, duracionVuelo, ganador } from './penales-logica.js';
import {
  W, H, ESC, PISO_TRIBUNA, PELOTA0, PATEADOR0, PATEADOR1, ARQUERO0, PERIODO, clamp, lerp, suave, onda,
  kitArquero, escudoHtml, figura, crearTribuna, crearAlambrado, pasto, arco, palos, pelotaDibujo, controles,
} from './penales-dibujo.js';

// o: { yo, rival, ronda, partido: { empate, primero, mios, suyos }, alPatear(), alTerminar(gano) }
export function crearTanda(cont, o) {
  const { yo, rival, partido } = o;
  const st = {
    fase: 'intro',            // intro · aviso · apuntar · atajar · carrera · vuelo · resultado · fin
    mios: partido.mios, suyos: partido.suyos, turno: 'patear',
    paso: 0, valores: [null, null, null], indicador: 0.5, faseInd: 0,
    t0: 0, tiro: null, festejo: 0,
  };
  // La tribuna siempre alienta al que patea segundo. Es solo ambientación: no cambia ninguna probabilidad.
  const hinchada = partido.primero === 'yo' ? rival : yo;
  const primeroEq = partido.primero === 'yo' ? yo : rival;
  const tribuna = crearTribuna(hinchada);
  const alambrado = crearAlambrado(hinchada);
  const kitArqYo = kitArquero(yo, rival), kitArqRival = kitArquero(rival, yo);
  let raf = 0, destruido = false;

  cont.innerHTML = `
    <div class="pen">
      <div class="pen__cancha">
        <canvas width="${W * ESC}" height="${H * ESC}" role="img" aria-label="Cancha de penales: arco, arquero y pateador"></canvas>
        <div class="pen__tv" data-tv></div>
        <p class="pen__msg" data-msg aria-hidden="true"></p>
        <div class="pen__capa" data-capa></div>
      </div>
      <p class="pen__ayuda" data-ayuda></p>
      <p class="pen__teclas">Con teclado: <kbd>Espacio</kbd> frena cada indicador · para atajar, <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> arriba, <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> al medio, <kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd> abajo</p>
      <p class="pen__vivo" data-vivo role="status" aria-live="polite"></p>
    </div>`;
  const $ = (n) => cont.querySelector(`[data-${n}]`);
  const cv = cont.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const goles = (l) => l.filter(Boolean).length;

  function marcador() {
    const largo = Math.max(st.mios.length, st.suyos.length);
    const total = Math.max(5, largo, st.fase === 'fin' ? 0 : Math.min(st.mios.length, st.suyos.length) + 1);
    const casillas = (l) => Array.from({ length: total }, (_, i) => `<i class="${l[i] === true ? 'g' : l[i] === false ? 'e' : ''}"></i>`).join('');
    $('tv').innerHTML = `
      <div class="pen__tv-eq">${escudoHtml(yo)}<span class="pen__tv-nombre">${yo.corto}</span></div>
      <div class="pen__tv-res" aria-label="Resultado de los 90 minutos"><b>${partido.empate}</b><span>-</span><b>${partido.empate}</b></div>
      <div class="pen__tv-eq pen__tv-eq--der"><span class="pen__tv-nombre">${rival.corto}</span>${escudoHtml(rival)}</div>
      <div class="pen__tv-fin">Finalizado · 90'</div>
      <div class="pen__tv-serie" aria-hidden="true">${casillas(st.mios)}</div>
      <div class="pen__tv-pen"><small>${total > 5 ? 'Muerte súbita' : 'Penales'}</small><span><b>${goles(st.mios)}</b>-<b>${goles(st.suyos)}</b></span></div>
      <div class="pen__tv-serie pen__tv-serie--der" aria-hidden="true">${casillas(st.suyos)}</div>`;
  }
  const ayuda = (t) => { $('ayuda').textContent = t; };
  const decir = (t) => { $('vivo').textContent = t; };
  function mensaje(t, clase) {
    const m = $('msg');
    m.textContent = t;
    m.className = `pen__msg ${t ? 'visible' : ''} ${clase || ''}`;
  }
  function capa(html) {
    const c = $('capa');
    c.innerHTML = html;
    c.classList.toggle('visible', !!html);
    c.querySelector('button, a')?.focus({ preventScroll: true });
  }
  const fase = (f) => { st.fase = f; st.t0 = performance.now(); };

  /* ----- Flujo ----- */
  // Le toca patear al usuario si ya pateó menos, o si van iguales y él patea primero.
  const tocaAlUsuario = () => (partido.primero === 'yo' ? st.mios.length === st.suyos.length : st.mios.length < st.suyos.length);
  function siguiente() {
    const g = ganador(st.mios, st.suyos);
    if (g) return terminar(g);
    if (tocaAlUsuario()) turnoPatear(); else turnoAtajar();
  }
  function turnoPatear() {
    st.turno = 'patear'; st.tiro = null;
    st.valores = [null, null, null]; st.paso = 0; st.faseInd = Math.random();
    mensaje('');
    fase('apuntar');
    ayuda('Pateás vos · 1 de 3: tocá para frenar la dirección');
  }
  function turnoAtajar() {
    st.turno = 'atajar'; st.tiro = null;
    mensaje('');
    fase('atajar');
    ayuda('Atajás vos · tocá el sector del arco donde te vas a tirar');
    decir('Te toca atajar. Elegí un sector del arco.');
  }
  const valorIndicador = (ahora) => onda(st.faseInd + (ahora - st.t0) / PERIODO[st.paso]);
  function frenar() {
    const ahora = performance.now();
    if (st.fase !== 'apuntar' || ahora - st.t0 < 220) return;
    st.valores[st.paso] = valorIndicador(ahora);
    if (st.paso < 2) {
      st.paso++; st.t0 = ahora; st.faseInd = Math.random();
      ayuda(st.paso === 1 ? '2 de 3: tocá para frenar la altura' : '3 de 3: tocá para frenar la potencia');
      return;
    }
    const [h, v, p] = [st.valores[0] * 2 - 1, st.valores[1], st.valores[2]];
    const pt = destino(h, v, p);
    const donde = clasificar(pt);
    const zona = arqueroIA(pt, p);
    let resultado = donde === 'adentro' ? 'gol' : donde;
    if (donde === 'adentro' && Math.random() < probAtajada(zona, pt, p, true)) resultado = 'atajada';
    st.tiro = { pt, p, dur: duracionVuelo(p), resultado, zona, demora: 40 + 110 * p };
    ayuda('');
    fase('carrera');
  }
  function elegirZona(zona) {
    if (st.fase !== 'atajar' || performance.now() - st.t0 < 220) return;
    const { pt, p } = remateRival();
    const donde = clasificar(pt);
    let resultado = donde === 'adentro' ? 'gol' : donde;
    if (donde === 'adentro' && Math.random() < probAtajada(zona, pt, p)) resultado = 'atajada';
    st.tiro = { pt, p, dur: duracionVuelo(p), resultado, zona, demora: 0 };
    ayuda('');
    fase('carrera');
  }
  function llego() {
    const t = st.tiro;
    const pateo = st.turno === 'patear';
    const gol = t.resultado === 'gol';
    (pateo ? st.mios : st.suyos).push(gol);
    o.alPatear?.();
    const textos = { gol: '¡Gol!', atajada: pateo ? 'Atajó el arquero' : '¡Atajaste!', palo: '¡Palo!', afuera: 'Afuera' };
    mensaje(textos[t.resultado], (pateo ? gol : !gol) ? 'bien' : 'mal');
    if (gol) st.festejo = performance.now();
    marcador();
    decir(`${pateo ? yo.nombre : rival.nombre}: ${textos[t.resultado].replace(/[¡!]/g, '')}. Penales: ${goles(st.mios)} a ${goles(st.suyos)}.`);
    fase('resultado');
  }
  function terminar(g) {
    fase('fin');
    marcador(); mensaje(''); ayuda('');
    const gano = g === 'yo';
    const pasa = gano ? yo : rival;
    capa(`
      <p class="pen__capa-ronda">${gano ? '¡Ganaste la tanda!' : 'Perdiste la tanda'}</p>
      <div class="pen__capa-ganador">${escudoHtml(pasa, 'pen__escudo--grande')}</div>
      <h2 class="pen__capa-tit">${o.esFinal ? 'Campeón' : 'Pasa'}: ${pasa.nombre}</h2>
      <p class="pen__capa-res">90': ${yo.corto} ${partido.empate} – ${partido.empate} ${rival.corto}<br>Penales: ${goles(st.mios)} – ${goles(st.suyos)}${st.mios.length > 5 ? ' · en muerte súbita' : ''}</p>
      <div class="pen__capa-btns"><button type="button" class="btn-principal" data-seguir>Continuar</button></div>`);
    $('capa').querySelector('[data-seguir]').addEventListener('click', () => o.alTerminar(gano));
    decir(`Final. ${gano ? 'Ganaste' : 'Perdiste'} ${goles(st.mios)} a ${goles(st.suyos)} en los penales.`);
  }
  function presentar() {
    const empezada = st.mios.length + st.suyos.length > 0;
    capa(`
      <p class="pen__capa-ronda">Copa Argentina · ${o.ronda}</p>
      <h2 class="pen__capa-tit">${yo.nombre} <span>${partido.empate} – ${partido.empate}</span> ${rival.nombre}</h2>
      <p class="pen__capa-txt">Terminaron empatados los 90 minutos. Se define por penales: cinco por equipo.</p>
      <p class="pen__capa-res">${empezada ? `Tanda en curso: ${goles(st.mios)} – ${goles(st.suyos)}` : `${primeroEq.nombre} patea primero`}</p>
      <div class="pen__capa-btns"><button type="button" class="btn-principal" data-jugar>${empezada ? 'Continuar' : 'Jugar'}</button></div>`);
    $('capa').querySelector('[data-jugar]').addEventListener('click', () => {
      capa('');
      if (empezada) return siguiente();
      mensaje(`${primeroEq.corto} patea primero`, 'bien');
      decir(`${primeroEq.nombre} patea primero.`);
      fase('aviso');
    });
  }

  /* ----- Posturas ----- */
  function posturaArquero(ahora) {
    const t = st.tiro;
    const base = { x: ARQUERO0.x, y: ARQUERO0.y, rot: 0, brazos: 0.22, agachado: 0.25 + Math.sin(ahora / 260) * 0.08 };
    if (!t || ['carrera', 'apuntar', 'atajar', 'aviso', 'intro'].includes(st.fase)) {
      if (st.fase === 'carrera') base.x += Math.sin(ahora / 90) * 3;
      return base;
    }
    const desde = st.fase === 'vuelo' ? ahora - st.t0 - t.demora : 1e6;
    const k = suave(clamp(desde / Math.min(t.dur * 0.95, 360), 0, 1));
    const z = centroZona(t.zona.col, t.zona.fila);
    const lado = t.zona.col - 1;
    let fin;
    if (lado === 0) {
      fin = t.zona.fila === 2 ? { x: base.x, y: base.y - 26, rot: 0, brazos: 1, agachado: 0 }
        : t.zona.fila === 1 ? { x: base.x, y: base.y, rot: 0, brazos: 0.5, agachado: 0.1 }
          : { x: base.x, y: base.y + 8, rot: 0, brazos: 0.12, agachado: 1 };
    } else {
      const vx = z.x - base.x, vy = z.y - base.y;
      const d = Math.hypot(vx, vy), largo = 56;
      fin = { x: base.x + (vx / d) * (d - largo), y: base.y + (vy / d) * (d - largo), rot: Math.atan2(vx, -vy), brazos: 1, agachado: 0 };
    }
    const cae = st.fase === 'resultado' && lado !== 0 ? suave(clamp((ahora - st.t0) / 420, 0, 1)) : 0;
    return {
      x: lerp(base.x, fin.x, k), y: lerp(lerp(base.y, fin.y, k), 246, cae * 0.85),
      rot: lerp(0, fin.rot, k) + cae * lado * 0.25, brazos: lerp(base.brazos, fin.brazos, k), agachado: lerp(base.agachado, fin.agachado, k),
    };
  }
  const manosArquero = (a) => ({ x: a.x + Math.sin(a.rot) * 56, y: a.y - Math.cos(a.rot) * 56 * (a.brazos > 0.6 ? 1 : 0.45) });
  function posturaPateador(ahora) {
    const en = ahora - st.t0;
    if (st.fase === 'carrera') {
      const k = clamp(en / 620, 0, 1);
      return { x: lerp(PATEADOR0.x, PATEADOR1.x, k), y: lerp(PATEADOR0.y, PATEADOR1.y, k), s: lerp(PATEADOR0.s, PATEADOR1.s, k), paso: Math.sin(k * Math.PI * 5), patada: clamp((k - 0.82) / 0.18, 0, 1), brazos: 0.2 + Math.abs(Math.sin(k * Math.PI * 5)) * 0.12 };
    }
    if (st.fase === 'vuelo') return { ...PATEADOR1, paso: 0, patada: clamp(1 - en / 200, 0, 1), brazos: 0.25 };
    if ((st.fase === 'resultado' || st.fase === 'fin') && st.tiro) {
      const gol = st.tiro.resultado === 'gol';
      const k = suave(clamp(en / 300, 0, 1));
      return { ...PATEADOR1, y: PATEADOR1.y - (gol ? Math.abs(Math.sin(en / 170)) * 9 : 0), paso: 0, patada: 0, brazos: lerp(0.25, gol ? 1 : 0.72, k) };
    }
    return { ...PATEADOR0, paso: 0, patada: 0, brazos: 0.12 };
  }
  function posturaPelota(ahora, arq) {
    const t = st.tiro;
    if (!t || !['vuelo', 'resultado', 'fin'].includes(st.fase)) return { ...PELOTA0, r: 8.5, giro: 0, alfa: 1, lejos: false };
    const en = ahora - st.t0;
    if (st.fase === 'vuelo') {
      const k = clamp(en / t.dur, 0, 1);
      const curva = Math.sin(k * Math.PI) * (5 + 16 * (1 - t.p));
      return { x: lerp(PELOTA0.x, t.pt.x, k), y: lerp(PELOTA0.y, t.pt.y, k) - curva, r: lerp(8.5, 5.2, k), giro: k * 9, alfa: 1, lejos: true };
    }
    const u = clamp(en / 600, 0, 1.6);
    const lado = Math.sign(t.pt.x - ARCO_CX) || 1;
    if (t.resultado === 'gol') {
      const k = clamp(en / 380, 0, 1);
      return { x: t.pt.x + lado * 5 * k, y: lerp(t.pt.y, ARCO.y2 - 6, k * k), r: 5, giro: 9 + k * 2, alfa: 1, lejos: true, enRed: true };
    }
    if (t.resultado === 'atajada') {
      const m = manosArquero(arq);
      if (Math.hypot(m.x - t.pt.x, m.y - t.pt.y) < 20) return { x: m.x, y: m.y, r: 5.4, giro: 9, alfa: 1, lejos: true };
      return { x: t.pt.x + lado * 70 * u, y: Math.min(t.pt.y - 70 * u + 150 * u * u, 300), r: 5.2 + u, giro: 9 + u * 6, alfa: 1, lejos: true };
    }
    if (t.resultado === 'palo') {
      return { x: t.pt.x - lado * 46 * u + (t.pt.y < ARCO.y1 + 6 ? lado * 20 * u : 0), y: Math.min(t.pt.y + 20 * u + 150 * u * u, 330), r: 5.2 + u * 1.6, giro: 9 - u * 6, alfa: 1, lejos: true };
    }
    const dx = t.pt.x - PELOTA0.x, dy = t.pt.y - PELOTA0.y;
    return { x: t.pt.x + dx * 0.22 * u, y: t.pt.y + dy * 0.22 * u, r: Math.max(5.2 - u * 1.2, 3.4), giro: 9 + u * 5, alfa: clamp(1.5 - u, 0, 1), lejos: true };
  }

  /* ----- Bucle ----- */
  function avanzar(ahora) {
    const en = ahora - st.t0;
    if (st.fase === 'apuntar') st.indicador = valorIndicador(ahora);
    else if (st.fase === 'aviso' && en > 1500) siguiente();
    else if (st.fase === 'atajar' && en > 6000) elegirZona({ col: 1, fila: 1 }); // si no elegís, se queda parado
    else if (st.fase === 'carrera' && en >= 620) fase('vuelo');
    else if (st.fase === 'vuelo' && en >= st.tiro.dur) llego();
    else if (st.fase === 'resultado' && en >= 1700) siguiente();
  }
  function dibujar(ahora) {
    ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
    const salto = st.festejo && ahora - st.festejo < 1500 ? Math.abs(Math.sin((ahora - st.festejo) / 110)) * 3.5 : 0;
    ctx.drawImage(tribuna, 0, -salto, W, PISO_TRIBUNA + 12);
    ctx.drawImage(alambrado, 0, 0, W, PISO_TRIBUNA + 12);
    pasto(ctx);
    // Antes del primer penal, el pateador que se ve es el del equipo que arranca.
    const pateoYo = ['intro', 'aviso'].includes(st.fase) && !st.tiro ? tocaAlUsuario() : st.turno === 'patear';
    const arq = posturaArquero(ahora);
    const pat = posturaPateador(ahora);
    const pel = posturaPelota(ahora, arq);
    const enRed = st.fase === 'resultado' && st.tiro?.resultado === 'gol';
    arco(ctx, enRed ? Math.sin((ahora - st.t0) / 60) * 5 * Math.max(0, 1 - (ahora - st.t0) / 700) : 0);
    if (pel.enRed) pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro);
    palos(ctx);
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(arq.x, 268, 20, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(pat.x, pat.y + 42 * pat.s, 20 * pat.s, 5.5 * pat.s, 0, 0, 7); ctx.fill();
    figura(ctx, { ...arq, s: 1, kit: pateoYo ? kitArqRival : kitArqYo, espalda: false });
    if (pel.lejos && !pel.enRed) pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro, pel.alfa);
    figura(ctx, { ...pat, kit: pateoYo ? yo : rival, espalda: true });
    if (!pel.lejos) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(pel.x + 2, pel.y + 7, 9, 3, 0, 0, 7); ctx.fill();
      pelotaDibujo(ctx, pel.x, pel.y, pel.r, pel.giro);
    }
    if (st.turno === 'patear' && ['apuntar', 'carrera', 'vuelo'].includes(st.fase)) controles(ctx, st, ahora, cv.clientWidth < 520);
  }
  function bucle(ahora) {
    if (destruido) return;
    avanzar(ahora);
    dibujar(ahora);
    raf = requestAnimationFrame(bucle);
  }

  /* ----- Entrada ----- */
  cv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (st.fase === 'apuntar') return frenar();
    if (st.fase !== 'atajar') return;
    const r = cv.getBoundingClientRect();
    const p = { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
    if (p.y > 330) return; // lejos del arco: no cuenta
    elegirZona(zonaDe(p));
  });
  const TECLAS = { q: [0, 2], w: [1, 2], e: [2, 2], a: [0, 1], s: [1, 1], d: [2, 1], z: [0, 0], x: [1, 0], c: [2, 0] };
  function tecla(ev) {
    if (ev.target.closest('button, input, select, textarea, a')) return;
    const k = ev.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && st.fase === 'apuntar') { ev.preventDefault(); frenar(); }
    else if (TECLAS[k] && st.fase === 'atajar') { ev.preventDefault(); elegirZona({ col: TECLAS[k][0], fila: TECLAS[k][1] }); }
  }
  document.addEventListener('keydown', tecla);

  marcador();
  // Si se recargó justo después del último penal, la tanda ya está definida.
  const yaDefinida = ganador(st.mios, st.suyos);
  if (yaDefinida) terminar(yaDefinida); else presentar();
  raf = requestAnimationFrame(bucle);

  return function destruir() {
    destruido = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', tecla);
  };
}
