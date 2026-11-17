// Una tanda de penales jugable. El usuario patea con tres controles y ataja eligiendo a dónde tirarse.
// No sabe nada de la copa: recibe los dos equipos, el empate de los 90' y quién patea primero.
//
// Cada penal pasa por estos estados, siempre en este orden:
//   PREPARACION → CARRERA → IMPACTO → BALON_EN_MOVIMIENTO → RESOLUCION → RECUPERACION → SIGUIENTE_PENAL
// Las reglas viven en penales-logica.js, la física en penales-fisica.js, los cuerpos en penales-cuerpo.js
// y el dibujo en penales-dibujo.js. Este archivo solo coordina: tiempos, turnos, entrada y marcador.
import { ganador, remateUsuario, generarRemateRival, decidirArqueroIA, ARQUERO_IA } from './penales-logica.js';
import { CANCHA, DT, escala, proyectar, pantallaAArco, velocidadHacia, crearPelota, patear, pasoPelota, definida, resultado, cruce } from './penales-fisica.js';
import {
  REACCION, crearArquero, lanzarEstirada, afinarManos, momentoEstirada, poseArquero, arqueroDePie,
  articulaciones, partes, crearCarrera, poseEjecutante,
} from './penales-cuerpo.js';
import {
  W, H, ESC, PISO_TRIBUNA, PERIODO, clamp, onda,
  kitArquero, escudoHtml, cuerpoDibujo, crearTribuna, crearAlambrado, pasto, arco, palos, pelotaDibujo, controles,
} from './penales-dibujo.js';

const ESPERA_RIVAL = [2, 4];      // s: el rival arranca la carrera en algún momento de este rango, sin avisar
const T_RESOLUCION = 1.35;        // s que se deja correr la jugada después de definirse
const T_FUNDIDO = 0.26;           // s del fundido al cambiar de pateador
const ZONAS_X = [-2.44, 0, 2.44], ZONAS_Y = [0.45, 1.36, 2.27];

// o: { yo, rival, ronda, esFinal, partido: { empate, primero, mios, suyos }, alPatear(), alTerminar(gano) }
export function crearTanda(cont, o) {
  const { yo, rival, partido } = o;
  const st = { fase: 'intro', t0: 0, mios: partido.mios, suyos: partido.suyos, animo: 'neutral', tAnimo: 0, fundido: -9 };
  const ctl = { activo: false, paso: 0, valores: [null, null, null], indicador: 0.5, faseInd: 0, ms0: 0 };
  // La tribuna siempre alienta al que patea segundo. Es solo ambientación: no cambia ninguna probabilidad.
  const hinchada = partido.primero === 'yo' ? rival : yo;
  const primeroEq = partido.primero === 'yo' ? yo : rival;
  const tribuna = crearTribuna(hinchada);
  const alambrado = crearAlambrado();
  const kitArqYo = kitArquero(yo, rival), kitArqRival = kitArquero(rival, yo);
  let reloj = 0, acumulado = 0, anterior = 0, raf = 0, destruido = false;
  let pen = null;

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
  const fase = (f) => { st.fase = f; st.t0 = reloj; cont.firstElementChild.dataset.estado = f; };
  const en = () => reloj - st.t0;

  /* ----- Turnos ----- */
  // Le toca patear al usuario si ya pateó menos, o si van iguales y él patea primero.
  const tocaAlUsuario = () => (partido.primero === 'yo' ? st.mios.length === st.suyos.length : st.mios.length < st.suyos.length);

  function nuevoPenal() {
    pen = {
      pateaYo: tocaAlUsuario(), carrera: crearCarrera(), arq: crearArquero(), pelota: crearPelota(),
      tInicio: reloj, tCarrera: null, tImpacto: null, vel: null, cruce: null,
      eleccion: null, tEleccion: 0,      // a dónde eligió tirarse el usuario (cuando ataja)
      planIA: null,                      // decisión del arquero rival (cuando patea el usuario)
      amague: Math.random() * 6, res: null, tRes: 0, tRed: -9, jAnt: null,
    };
  }
  function fijarRemate(obj, v0, tCarrera) {
    pen.vel = velocidadHacia(obj, v0);
    pen.cruce = cruce(pen.vel);                 // por dónde va a pasar: queda decidido antes del impacto
    pen.tCarrera = tCarrera;
    pen.tImpacto = tCarrera + pen.carrera.duracion;
  }
  function preparar() {
    st.animo = 'neutral';
    mensaje('');
    fase('PREPARACION');
    pen.tInicio = reloj;
    if (pen.pateaYo) {
      Object.assign(ctl, { activo: true, paso: 0, valores: [null, null, null], faseInd: Math.random(), ms0: performance.now() });
      ayuda('Pateás vos · 1 de 3: tocá para frenar la dirección');
      decir('Te toca patear.');
    } else {
      // El remate del rival y el momento en que arranca quedan sorteados acá. Nada de lo que haga el usuario los cambia.
      const r = generarRemateRival();
      fijarRemate(r.obj, r.v0, reloj + ESPERA_RIVAL[0] + Math.random() * (ESPERA_RIVAL[1] - ESPERA_RIVAL[0]));
      ctl.activo = false;
      ayuda('Atajás vos · tocá el lugar del arco donde te vas a tirar. El rival patea cuando quiere.');
      decir('Te toca atajar. Elegí a dónde tirarte: el rival patea sin avisar.');
    }
  }
  function siguiente() {
    const g = ganador(st.mios, st.suyos);
    if (g) return terminar(g);
    st.fundido = reloj;
    nuevoPenal();
    preparar();
  }

  /* ----- Entrada del usuario ----- */
  const valorIndicador = (ms) => onda(ctl.faseInd + (ms - ctl.ms0) / PERIODO[ctl.paso]);
  function frenar() {
    const ms = performance.now();
    if (st.fase !== 'PREPARACION' || !ctl.activo || ms - ctl.ms0 < 220) return;
    ctl.valores[ctl.paso] = valorIndicador(ms);
    if (ctl.paso < 2) {
      ctl.paso++; ctl.ms0 = ms; ctl.faseInd = Math.random();
      ayuda(ctl.paso === 1 ? '2 de 3: tocá para frenar la altura' : '3 de 3: tocá para frenar la potencia');
      return;
    }
    ctl.activo = false;
    const r = remateUsuario(ctl.valores[0] * 2 - 1, ctl.valores[1], ctl.valores[2]);
    fijarRemate(r.obj, r.v0, reloj);
    // El arquero rival decide ahora: o se la juega antes del remate o espera y reacciona.
    const d = decidirArqueroIA(pen.cruce);
    if (d.obj) pen.planIA = { obj: d.obj, tLanz: pen.tImpacto + (d.demora < 0 ? momentoEstirada(d.obj, pen.cruce.t) : d.demora) };
    ayuda('');
    fase('CARRERA');
  }
  // El usuario elige a dónde tirarse. Puede cambiar de idea hasta que el arquero se lanza; después, ya no.
  function elegir(obj) {
    if (!pen || pen.pateaYo || pen.arq.plan || pen.res) return;
    if (!['PREPARACION', 'CARRERA', 'BALON_EN_MOVIMIENTO'].includes(st.fase)) return;
    if (st.fase === 'PREPARACION' && en() < 0.2) return;
    pen.eleccion = { x: clamp(obj.x, -3.5, 3.5), y: clamp(obj.y, 0.2, 2.5) };
    pen.tEleccion = reloj;
    if (st.fase === 'PREPARACION') ayuda('Listo. Podés cambiar de lugar hasta que el arquero se tire.');
  }

  /* ----- Simulación (paso fijo) ----- */
  function arqueroPaso() {
    const a = pen.arq;
    if (a.plan) {
      // Ya en el aire: con la pelota viajando, acomoda las manos hasta donde le da el brazo.
      if (pen.pelota.enJuego) afinarManos(a, pen.cruce, reloj, pen.pateaYo ? ARQUERO_IA.radio : undefined);
      return;
    }
    if (pen.res || !pen.tImpacto) {
      if (pen.pateaYo && !pen.res) a.inclinacion = 0.45 * Math.sin(reloj * 1.3 + pen.amague) * Math.sin(reloj * 0.7); // amaga mientras el usuario apunta
      return;
    }
    if (pen.pateaYo) {
      a.inclinacion *= 0.97;
      if (pen.planIA && reloj >= pen.planIA.tLanz) lanzarEstirada(a, pen.planIA.obj, reloj);
      return;
    }
    // Ataja el usuario. Sin elección, el arquero se queda parado en el centro.
    const e = pen.eleccion;
    a.inclinacion += ((e ? clamp(e.x / 2.2, -1, 1) : 0) - a.inclinacion) * 0.03;
    if (!e) return;
    // Si eligió con tiempo, se lanza en el momento justo. Si eligió tarde, sale apenas puede y llega más tarde:
    // esa demora es real y puede alcanzar o no, según a dónde vaya la pelota.
    const tLanz = Math.max(pen.tEleccion + REACCION, pen.tImpacto + momentoEstirada(e, pen.cruce.t, a.inclinacion * 0.16));
    if (reloj >= tLanz) lanzarEstirada(a, e, reloj);
  }
  function resolver() {
    const b = pen.pelota;
    pen.res = resultado(b); pen.tRes = reloj;
    if (pen.res !== 'gol') b.afuera = true;      // la jugada ya está juzgada: no puede convertirse en gol después
    const gol = pen.res === 'gol', pateo = pen.pateaYo;
    (pateo ? st.mios : st.suyos).push(gol);     // se anota una sola vez por penal
    o.alPatear?.();
    const textos = { gol: '¡Gol!', atajada: pateo ? 'Atajó el arquero' : '¡Atajaste!', palo: '¡Palo!', afuera: 'Afuera' };
    mensaje(textos[pen.res], (pateo ? gol : !gol) ? 'bien' : 'mal');
    const favorecido = (pateo === gol) ? yo : rival;
    st.animo = favorecido === hinchada ? 'festejo' : 'bronca'; st.tAnimo = reloj;
    marcador();
    decir(`${pateo ? yo.nombre : rival.nombre}: ${textos[pen.res].replace(/[¡!]/g, '')}. Penales: ${goles(st.mios)} a ${goles(st.suyos)}.`);
    fase('RESOLUCION');
  }
  function pelotaPaso() {
    const b = pen.pelota;
    if (!b.enJuego) return;
    let cuerpo = null;
    if (Math.abs(b.z - CANCHA.Z_ARQUERO) < 1) {
      const j = articulaciones(poseArquero(pen.arq, reloj));
      cuerpo = partes(j, pen.jAnt, DT);
      pen.jAnt = j;
    } else pen.jAnt = null;
    pasoPelota(b, cuerpo);
    if (b.eventos.includes('red')) pen.tRed = reloj;
  }
  function paso() {
    reloj += DT;
    if (!pen) return;
    switch (st.fase) {
      case 'aviso': if (en() > 1.5) preparar(); break;
      case 'PREPARACION':
        arqueroPaso();
        if (!pen.pateaYo && reloj >= pen.tCarrera) { ayuda(pen.eleccion ? '' : 'Tocá el arco para tirarte'); fase('CARRERA'); }
        break;
      case 'CARRERA':
        arqueroPaso();
        if (reloj >= pen.tImpacto) fase('IMPACTO');
        break;
      case 'IMPACTO':                              // la pelota sale en el instante exacto del contacto con el pie
        patear(pen.pelota, pen.vel);
        ayuda('');
        fase('BALON_EN_MOVIMIENTO');
        break;
      case 'BALON_EN_MOVIMIENTO':
        arqueroPaso(); pelotaPaso();
        if (pen.pelota.t > 0.12 && definida(pen.pelota)) resolver();
        break;
      case 'RESOLUCION':
        arqueroPaso(); pelotaPaso();
        if (en() >= T_RESOLUCION) fase('RECUPERACION');
        break;
      case 'RECUPERACION':                         // se espera a que el arquero termine de caer y se levante
        arqueroPaso(); pelotaPaso();
        if ((en() > 0.35 && arqueroDePie(pen.arq, reloj)) || en() > 3.4) fase('SIGUIENTE_PENAL');
        break;
      case 'SIGUIENTE_PENAL':
        pelotaPaso();
        if (en() >= T_FUNDIDO || ganador(st.mios, st.suyos)) siguiente();
        break;
      default:
    }
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
      if (empezada) return preparar();
      mensaje(`${primeroEq.corto} patea primero`, 'bien');
      decir(`${primeroEq.nombre} patea primero.`);
      fase('aviso');
    });
  }

  /* ----- Dibujo ----- */
  function sombra(x, z, ancho, alfa) {
    const p = proyectar(x, 0, z);
    ctx.fillStyle = `rgba(0,0,0,${alfa})`;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, ancho * p.s, ancho * p.s * 0.26, 0, 0, 7); ctx.fill();
  }
  function dibujarPelota(b) {
    if (b.z < -5) return;                     // rebotó hasta detrás de la cámara: ya no se ve
    const p = proyectar(b.x, b.y, b.z);
    const lejos = b.z > CANCHA.LINEA + CANCHA.FONDO_RED ? clamp(1.6 - (b.z - CANCHA.LINEA) / 9, 0, 1) : 1;
    if (!b.gol && lejos > 0) sombra(b.x, b.z, 0.13, 0.26 * lejos * clamp(1 - b.y / 3.5, 0.15, 1));
    pelotaDibujo(ctx, p.x, p.y, CANCHA.RADIO_PELOTA * p.s, b.giro, lejos);
  }
  function dibujar(ms) {
    ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
    const tAnimo = reloj - st.tAnimo;
    tribuna.dibujar(ctx, reloj, st.animo, tAnimo);
    ctx.drawImage(alambrado, 0, 0, W, PISO_TRIBUNA + 12);
    tribuna.dibujarTrepados(ctx, reloj, st.animo, tAnimo);
    pasto(ctx);
    if (!pen) return;
    const b = pen.pelota, ZA = CANCHA.Z_ARQUERO;

    // Arquero: de la pose a las articulaciones y de ahí a la pantalla
    const ja = articulaciones(poseArquero(pen.arq, reloj));
    if (b.atrapada) { b.x = (ja.manoL.x + ja.manoR.x) / 2; b.y = Math.max(CANCHA.RADIO_PELOTA, (ja.manoL.y + ja.manoR.y) / 2); b.z = ZA - 0.14; }
    // Ejecutante
    const tau = pen.tCarrera === null ? -(reloj - pen.tInicio) - 0.01 : reloj - pen.tCarrera;
    const animoEj = pen.res ? (pen.res === 'gol' ? 'festeja' : 'lamenta') : null;
    const ej = poseEjecutante(pen.carrera, tau, animoEj, reloj - pen.tRes);
    const je = articulaciones(ej.pose);

    const detras = b.z > CANCHA.LINEA;           // la pelota ya pasó la línea: adentro del arco o afuera
    if (detras && !b.gol) dibujarPelota(b);
    const dRed = reloj - pen.tRed;
    arco(ctx, dRed < 0.8 ? Math.sin(dRed * 17) * 5 * (1 - dRed / 0.8) : 0);
    if (detras && b.gol) dibujarPelota(b);
    palos(ctx);
    if (!detras && b.z > ZA) dibujarPelota(b);
    sombra(ja.cadera.x, ZA, 0.34 + 0.3 * Math.abs(Math.sin(poseArquero(pen.arq, reloj).th)), 0.22);
    const sa = escala(ZA);
    cuerpoDibujo(ctx, ja, (q) => proyectar(q.x, q.y, ZA), sa, pen.pateaYo ? kitArqRival : kitArqYo, { guantes: true });
    // Marca discreta del lugar elegido por el usuario (solo su propia elección, nunca la del rival)
    if (!pen.pateaYo && pen.eleccion && !pen.arq.plan) {
      const m = proyectar(pen.eleccion.x, pen.eleccion.y, ZA);
      ctx.strokeStyle = 'rgba(214,195,74,.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    if (b.z <= ZA && b.z >= ej.z) dibujarPelota(b);
    sombra(je.cadera.x, ej.z, 0.32, 0.22);
    cuerpoDibujo(ctx, je, (q) => proyectar(q.x, q.y, ej.z), escala(ej.z), pen.pateaYo ? yo : rival, { espalda: true });
    if (b.z < ej.z) dibujarPelota(b);

    if (pen.pateaYo && ['PREPARACION', 'CARRERA', 'IMPACTO', 'BALON_EN_MOVIMIENTO'].includes(st.fase)) {
      if (ctl.activo) ctl.indicador = valorIndicador(ms);
      controles(ctx, ctl, ms, cv.clientWidth < 520);
    }
    // Fundido corto al cambiar de pateador, para que nadie "aparezca" de golpe en otro lugar
    const f = st.fase === 'SIGUIENTE_PENAL' ? en() / T_FUNDIDO : 1 - (reloj - st.fundido) / T_FUNDIDO;
    if (f > 0) { ctx.fillStyle = `rgba(10,14,20,${clamp(f, 0, 1) * 0.92})`; ctx.fillRect(0, PISO_TRIBUNA, W, H - PISO_TRIBUNA); }
  }
  function bucle(ms) {
    if (destruido) return;
    // Paso fijo: la simulación avanza siempre de a 1/240 s, sin importar los cuadros por segundo de la pantalla.
    acumulado += Math.min(0.1, (ms - (anterior || ms)) / 1000);
    anterior = ms;
    while (acumulado >= DT) { paso(); acumulado -= DT; }
    dibujar(ms);
    raf = requestAnimationFrame(bucle);
  }

  /* ----- Eventos ----- */
  cv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (pen?.pateaYo) return frenar();
    const r = cv.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W, py = ((ev.clientY - r.top) / r.height) * H;
    if (py > 330) return; // lejos del arco: no cuenta
    elegir(pantallaAArco(px, py, CANCHA.Z_ARQUERO));
  });
  const TECLAS = { q: [0, 2], w: [1, 2], e: [2, 2], a: [0, 1], s: [1, 1], d: [2, 1], z: [0, 0], x: [1, 0], c: [2, 0] };
  function tecla(ev) {
    if (ev.target.closest('button, input, select, textarea, a') || !pen) return;
    const k = ev.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && pen.pateaYo && ctl.activo) { ev.preventDefault(); frenar(); }
    else if (TECLAS[k] && !pen.pateaYo) { ev.preventDefault(); elegir({ x: ZONAS_X[TECLAS[k][0]], y: ZONAS_Y[TECLAS[k][1]] }); }
  }
  document.addEventListener('keydown', tecla);

  marcador();
  nuevoPenal();
  // Si se recargó justo después del último penal, la tanda ya está definida.
  const yaDefinida = ganador(st.mios, st.suyos);
  if (yaDefinida) terminar(yaDefinida); else presentar();
  raf = requestAnimationFrame(bucle);

  // Para las pruebas automáticas: estado de solo lectura.
  cont.firstElementChild.__penal = () => ({ fase: st.fase, reloj, pen, animo: st.animo, mios: st.mios, suyos: st.suyos });

  return function destruir() {
    destruido = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', tecla);
  };
}
