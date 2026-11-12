// Penales Copa Argentina: tandas de penales desde 16avos hasta la final.
// Pateás y atajás. Al atajar, tocá (o hacé clic) donde querés tirarte apenas sale el remate.
import { estadoJuego, guardarEstado } from '../lib/progreso.js';

const RONDAS = [
  { t: '16avos de final', viaje: 1000, reticula: 1.0, punteria: 0.25 },
  { t: 'Octavos de final', viaje: 900, reticula: 1.15, punteria: 0.32 },
  { t: 'Cuartos de final', viaje: 800, reticula: 1.3, punteria: 0.4 },
  { t: 'Semifinal', viaje: 710, reticula: 1.45, punteria: 0.48 },
  { t: 'Final', viaje: 630, reticula: 1.6, punteria: 0.56 },
];
// Clubes ficticios, para no usar nombres ni escudos reales.
const RIVALES = ['Sportivo Río Seco', 'Atlético Villa Pampa', 'Deportivo Laguna Verde', 'Club Unión del Sur', 'Racing de Cerro Alto', 'Juventud Alameda', 'Talleres del Puerto', 'Social Monte Grande', 'Independiente del Valle Chico', 'Estrella de Los Molinos'];
const MI_EQUIPO = 'Latabla FC';

// Geometría (unidades lógicas del canvas 400x300)
const W = 400, H = 300;
const ARCO = { x1: 70, x2: 330, y1: 70, y2: 172 };
const PISO = ARCO.y2;
const BALON_INICIO = { x: 200, y: 272 };
const ALCANCE = 30;        // radio de las manos del arquero
const EMBOLSA = 13;        // si la pelota llega tan cerca del centro de las manos, la agarra

const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dentro = (p) => p.x > ARCO.x1 + 4 && p.x < ARCO.x2 - 4 && p.y > ARCO.y1 + 4 && p.y < PISO;
const palo = (p) => !dentro(p) && p.x > ARCO.x1 - 6 && p.x < ARCO.x2 + 6 && p.y > ARCO.y1 - 6 && p.y < PISO + 2;

function sembrarRivales() {
  const r = [...RIVALES].sort(() => Math.random() - 0.5);
  return RONDAS.map((_, i) => r[i]);
}

export function montarPenales(raiz) {
  const st = {
    ronda: 0, rivales: sembrarRivales(), camino: [], puntos: 0,
    fase: 'presentacion', mios: [], suyos: [], turno: 'patear',
    reloj: 0, anim: null, mensaje: '', tiempoTotal: 0,
  };
  // Elementos del arquero y la pelota
  const arquero = { x: 200, y: PISO, objetivo: { x: 200, y: 140 }, inclinacion: 0, rival: false };
  const pelota = { x: BALON_INICIO.x, y: BALON_INICIO.y, r: 9, desde: null, hasta: null, t0: 0, dur: 0, visible: true };
  let reticula = { x: 200, y: 120 };
  let raf = 0;
  let desmontado = false;

  raiz.innerHTML = `
  <div class="pen">
    <div class="pen__marcador" aria-live="off">
      <div class="pen__eq"><span class="pen__nombre" id="pen-yo">${MI_EQUIPO}</span><span class="pen__puntos" id="pen-g-yo">0</span></div>
      <div class="pen__ronda" id="pen-ronda">16avos</div>
      <div class="pen__eq pen__eq--der"><span class="pen__puntos" id="pen-g-el">0</span><span class="pen__nombre" id="pen-el">Rival</span></div>
      <div class="pen__serie" id="pen-s-yo" aria-label="Tus penales"></div>
      <div class="pen__serie pen__serie--der" id="pen-s-el" aria-label="Penales del rival"></div>
    </div>
    <div class="pen__cancha">
      <canvas id="pen-canvas" width="${W * 2}" height="${H * 2}" role="img" aria-label="Arco de penales"></canvas>
      <div class="pen__capa" id="pen-capa"></div>
      <p class="pen__msg" id="pen-msg" role="status" aria-live="polite"></p>
    </div>
    <p class="pen__ayuda" id="pen-ayuda"></p>
    <p class="pen__teclas">Teclado: <kbd>Espacio</kbd> para patear · para atajar <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> arriba y <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> abajo</p>
  </div>`;

  const cv = raiz.querySelector('#pen-canvas');
  const ctx = cv.getContext('2d');
  ctx.scale(2, 2);
  const $ = (id) => raiz.querySelector(id);

  /* ---------- Dibujo ---------- */
  function dibujar(now) {
    // Fondo: estadio de noche
    const cielo = ctx.createLinearGradient(0, 0, 0, PISO);
    cielo.addColorStop(0, '#141218'); cielo.addColorStop(1, '#2A2533');
    ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, PISO);
    // Tribuna
    ctx.fillStyle = '#1C1A21'; ctx.fillRect(0, 26, W, 30);
    for (let i = 0; i < 80; i++) { ctx.fillStyle = i % 3 ? '#3A3446' : '#6E5F8B'; ctx.fillRect((i * 37) % W, 30 + ((i * 13) % 22), 2, 2); }
    // Carteles
    ctx.fillStyle = '#6E5F8B'; ctx.fillRect(0, 56, W, 10);
    ctx.fillStyle = '#D6C34A'; ctx.font = '700 7px Saira, sans-serif'; ctx.textAlign = 'left';
    for (let x = 6; x < W; x += 96) ctx.fillText('LATABLA', x, 64);
    // Césped
    const pasto = ctx.createLinearGradient(0, PISO, 0, H);
    pasto.addColorStop(0, '#1F3A26'); pasto.addColorStop(1, '#2C5134');
    ctx.fillStyle = pasto; ctx.fillRect(0, PISO, W, H - PISO);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.05)'; ctx.fillRect(0, PISO + i * 22, W, 22); }
    // Área chica y punto penal
    ctx.strokeStyle = 'rgba(241,239,232,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(30, PISO); ctx.lineTo(10, PISO + 40); ctx.lineTo(390, PISO + 40); ctx.lineTo(370, PISO); ctx.stroke();
    ctx.fillStyle = 'rgba(241,239,232,.7)'; ctx.beginPath(); ctx.ellipse(200, BALON_INICIO.y + 6, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    // Red
    ctx.fillStyle = 'rgba(10,10,12,.55)'; ctx.fillRect(ARCO.x1, ARCO.y1, ARCO.x2 - ARCO.x1, PISO - ARCO.y1);
    ctx.strokeStyle = 'rgba(241,239,232,.13)'; ctx.lineWidth = 0.6;
    for (let x = ARCO.x1; x <= ARCO.x2; x += 10) { ctx.beginPath(); ctx.moveTo(x, ARCO.y1); ctx.lineTo(x, PISO); ctx.stroke(); }
    for (let y = ARCO.y1; y <= PISO; y += 10) { ctx.beginPath(); ctx.moveTo(ARCO.x1, y); ctx.lineTo(ARCO.x2, y); ctx.stroke(); }
    // Palos
    ctx.fillStyle = '#F1EFE8';
    ctx.fillRect(ARCO.x1 - 5, ARCO.y1 - 5, 5, PISO - ARCO.y1 + 5);
    ctx.fillRect(ARCO.x2, ARCO.y1 - 5, 5, PISO - ARCO.y1 + 5);
    ctx.fillRect(ARCO.x1 - 5, ARCO.y1 - 5, ARCO.x2 - ARCO.x1 + 10, 5);

    dibujarArquero();
    // Retícula al patear
    if (st.fase === 'apuntar') {
      ctx.strokeStyle = '#D6C34A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(reticula.x, reticula.y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(reticula.x - 14, reticula.y); ctx.lineTo(reticula.x - 5, reticula.y); ctx.moveTo(reticula.x + 5, reticula.y); ctx.lineTo(reticula.x + 14, reticula.y);
      ctx.moveTo(reticula.x, reticula.y - 14); ctx.lineTo(reticula.x, reticula.y - 5); ctx.moveTo(reticula.x, reticula.y + 5); ctx.lineTo(reticula.x, reticula.y + 14); ctx.stroke();
    }
    // Carrera del rival antes del remate: barra de "tensión"
    if (st.fase === 'carrera') {
      const k = Math.min(1, (now - st.reloj) / st.carrera);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(150, 286, 100, 6);
      ctx.fillStyle = '#8A7BA8'; ctx.fillRect(150, 286, 100 * k, 6);
    }
    dibujarPelota();
  }

  function dibujarArquero() {
    const a = arquero;
    const camiseta = a.rival ? '#3A3446' : '#D6C34A';
    const detalle = a.rival ? '#8A7BA8' : '#111111';
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.inclinacion);
    ctx.scale(1, (a.largo || 68) / 68);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 1, 16, 3, 0, 0, Math.PI * 2); ctx.fill();
    // piernas
    ctx.fillStyle = '#1A1A1C'; ctx.fillRect(-10, -22, 8, 22); ctx.fillRect(2, -22, 8, 22);
    // cuerpo
    ctx.fillStyle = camiseta; ctx.fillRect(-13, -52, 26, 32);
    ctx.fillStyle = detalle; ctx.fillRect(-13, -40, 26, 3);
    // brazos (hacia arriba y abiertos)
    ctx.strokeStyle = camiseta; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -48); ctx.lineTo(-24, -66); ctx.moveTo(11, -48); ctx.lineTo(24, -66); ctx.stroke();
    // guantes
    ctx.fillStyle = '#F1EFE8';
    ctx.beginPath(); ctx.arc(-25, -68, 5, 0, Math.PI * 2); ctx.arc(25, -68, 5, 0, Math.PI * 2); ctx.fill();
    // cabeza
    ctx.fillStyle = '#C79A78'; ctx.beginPath(); ctx.arc(0, -59, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function dibujarPelota() {
    if (!pelota.visible) return;
    const p = pelota;
    const sombraY = p.desde ? lerp(BALON_INICIO.y + 6, PISO + 2, progreso()) : p.y + p.r;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(p.x, sombraY, p.r, p.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F7F5EE'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#242426';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.35, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + p.giro;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(ang) * p.r * 0.72, p.y + Math.sin(ang) * p.r * 0.72, p.r * 0.18, 0, Math.PI * 2); ctx.fill();
    }
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  const progreso = () => (pelota.desde ? Math.min(1, (performance.now() - pelota.t0) / pelota.dur) : 0);

  /* ---------- Bucle ---------- */
  function bucle() {
    if (desmontado) return;
    const now = performance.now();
    if (st.fase === 'apuntar') {
      const t = (now - st.reloj) / 1000;
      const v = RONDAS[st.ronda].reticula;
      reticula = {
        x: 200 + 138 * Math.sin(t * 2.1 * v),
        y: 120 + 52 * Math.sin(t * 3.3 * v + 1.2),
      };
    }
    if (st.fase === 'carrera' && now - st.reloj >= st.carrera) rematarRival(now);
    if (pelota.desde) {
      const k = progreso();
      const e = 1 - Math.pow(1 - k, 2);
      pelota.x = lerp(pelota.desde.x, pelota.hasta.x, e);
      pelota.y = lerp(pelota.desde.y, pelota.hasta.y, e) - Math.sin(k * Math.PI) * 18;
      pelota.r = lerp(9, 5.2, e);
      pelota.giro += 0.3;
      if (k >= 1) llegoPelota();
    }
    moverArquero();
    dibujar(now);
    raf = requestAnimationFrame(bucle);
  }

  function moverArquero() {
    const a = arquero;
    if (!a.lanzado) return;
    const k = Math.min(1, (performance.now() - a.t0) / a.dur);
    const e = 1 - Math.pow(1 - k, 3);
    // El punto de referencia del arquero son sus manos; el cuerpo se ubica para que las manos lleguen al objetivo.
    const dx = a.objetivo.x - 200;
    const alto = PISO - a.objetivo.y;
    a.inclinacion = lerp(0, Math.max(-1.25, Math.min(1.25, dx / 95)) * (alto < 60 ? 1 : 0.65), e);
    // Si el cuerpo quedaría bajo el piso, se agacha: acorta el largo para que las manos lleguen igual.
    const incFinal = Math.max(-1.25, Math.min(1.25, dx / 95)) * (alto < 60 ? 1 : 0.65);
    const largo = Math.max(30, Math.min(68, alto / Math.cos(incFinal)));
    a.largo = lerp(68, largo, e);
    a.x = lerp(200, a.objetivo.x - Math.sin(incFinal) * largo, e);
    a.y = lerp(PISO, Math.min(PISO, a.objetivo.y + Math.cos(incFinal) * largo), e);
  }

  // Distancia de un punto al cuerpo del arquero (segmento de los pies a las manos)
  function distanciaAlCuerpo(p) {
    const a = arquero;
    const m = manosArquero();
    const vx = m.x - a.x, vy = m.y - a.y;
    const k = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(p.x - (a.x + vx * k), p.y - (a.y + vy * k));
  }

  function manosArquero() {
    const a = arquero;
    const L = a.largo || 68;
    return { x: a.x + Math.sin(a.inclinacion) * L, y: a.y - Math.cos(a.inclinacion) * L };
  }

  function lanzarArquero(obj, dur) {
    arquero.objetivo = { x: Math.max(ARCO.x1 + 14, Math.min(ARCO.x2 - 14, obj.x)), y: Math.max(ARCO.y1 + 6, Math.min(PISO - 12, obj.y)) };
    arquero.t0 = performance.now();
    arquero.dur = dur;
    arquero.lanzado = true;
  }

  function resetearJugada() {
    Object.assign(arquero, { x: 200, y: PISO, inclinacion: 0, lanzado: false, largo: 68 });
    Object.assign(pelota, { x: BALON_INICIO.x, y: BALON_INICIO.y, r: 9, desde: null, hasta: null, giro: 0, visible: true });
  }

  /* ---------- Jugadas ---------- */
  function siguienteTurno() {
    resetearJugada();
    if (st.turno === 'patear') {
      arquero.rival = true;
      st.fase = 'apuntar';
      st.reloj = performance.now();
      ayuda('Tocá el arco o apretá Espacio cuando la mira esté donde querés patear.');
    } else {
      arquero.rival = false;
      st.fase = 'carrera';
      st.reloj = performance.now();
      st.carrera = rnd(700, 1500);
      st.diveTemprano = null;
      ayuda('Esperá el remate y tocá donde te querés tirar.');
    }
    pintarMarcador();
  }

  function patear() {
    if (st.fase !== 'apuntar') return;
    const destino = { ...reticula };
    st.fase = 'vuelo';
    st.disparo = { tipo: 'mio', destino };
    tirarPelota(destino, 560);
    // El arquero rival adivina con una probabilidad que crece en cada ronda
    const r = RONDAS[st.ronda];
    const adivina = Math.random() < r.punteria;
    const obj = adivina
      ? { x: destino.x + rnd(-22, 22), y: destino.y + rnd(-18, 18) }
      : { x: [rnd(ARCO.x1 + 20, 150), 200, rnd(250, ARCO.x2 - 20)][Math.floor(Math.random() * 3)], y: rnd(95, 160) };
    setTimeout(() => !desmontado && lanzarArquero(obj, 360), 90);
    ayuda('');
  }

  function rematarRival(now) {
    const r = RONDAS[st.ronda];
    const desvio = Math.random() < 0.06;
    const destino = desvio
      ? { x: Math.random() < 0.5 ? rnd(30, ARCO.x1 - 8) : rnd(ARCO.x2 + 8, 370), y: rnd(80, 160) }
      : { x: rnd(ARCO.x1 + 14, ARCO.x2 - 14), y: rnd(ARCO.y1 + 12, PISO - 8) };
    st.fase = 'vuelo';
    st.disparo = { tipo: 'suyo', destino, salida: now };
    tirarPelota(destino, r.viaje);
    ayuda('¡Tirate!');
  }

  function atajar(p) {
    if (st.fase === 'carrera') { mostrar('Esperá el remate…', 600); return; }
    if (st.fase !== 'vuelo' || st.disparo.tipo !== 'suyo' || arquero.lanzado) return;
    const resto = st.disparo.salida + RONDAS[st.ronda].viaje - performance.now();
    lanzarArquero(p, Math.max(120, Math.min(300, resto)));
  }

  function tirarPelota(destino, dur) {
    pelota.desde = { x: BALON_INICIO.x, y: BALON_INICIO.y };
    pelota.hasta = destino;
    pelota.t0 = performance.now();
    pelota.dur = dur;
  }

  function llegoPelota() {
    const destino = pelota.hasta;
    pelota.desde = null;
    const dManos = dist(manosArquero(), destino);
    const dCuerpo = distanciaAlCuerpo(destino);
    const ataja = dentro(destino) && (dManos < ALCANCE || dCuerpo < 17);
    const d = Math.min(dManos, dCuerpo + 4);
    let texto, gol = false, bonus = 0;
    if (!dentro(destino)) texto = palo(destino) ? '¡Pegó en el palo!' : '¡Afuera!';
    else if (ataja) {
      const agarra = d < EMBOLSA;
      texto = agarra ? '¡La embolsó!' : '¡Atajada!';
      bonus = agarra ? 250 : 150;
      if (agarra) pelota.visible = false;
    } else { texto = '¡GOL!'; gol = true; }

    if (st.disparo.tipo === 'mio') {
      st.mios.push(gol);
      if (gol) st.puntos += 100;
    } else {
      st.suyos.push(gol);
      if (!gol && dentro(destino)) st.puntos += bonus;
    }
    st.fase = 'pausa';
    mostrar(texto, 1100, gol ? (st.disparo.tipo === 'mio' ? 'bien' : 'mal') : (st.disparo.tipo === 'mio' ? 'mal' : 'bien'));
    pintarMarcador();
    setTimeout(() => { if (!desmontado) evaluar(); }, 1200);
  }

  function evaluar() {
    const g = (a) => a.filter(Boolean).length;
    const [m, s] = [st.mios, st.suyos];
    const yo = g(m), el = g(s);
    let terminado = false, gane = false;
    if (m.length <= 5 && s.length <= 5) {
      const restYo = 5 - m.length, restEl = 5 - s.length;
      if (yo > el + restEl) { terminado = true; gane = true; }
      else if (el > yo + restYo) { terminado = true; gane = false; }
      else if (m.length === 5 && s.length === 5 && yo !== el) { terminado = true; gane = yo > el; }
    } else if (m.length === s.length && yo !== el) { terminado = true; gane = yo > el; }

    if (terminado) return finTanda(gane, yo, el);
    st.turno = m.length > s.length ? 'atajar' : 'patear';
    siguienteTurno();
  }

  function finTanda(gane, yo, el) {
    st.camino.push({ ronda: RONDAS[st.ronda].t, rival: st.rivales[st.ronda], yo, el, gane });
    st.fase = 'fin';
    if (gane && st.ronda === RONDAS.length - 1) {
      st.puntos += 1000;
      guardarEstado('penales', 'resuelto');
      return pantallaFinal(true);
    }
    if (!gane) {
      if (estadoJuego('penales') !== 'resuelto') guardarEstado('penales', 'fallado');
      return pantallaFinal(false);
    }
    capa(`
      <p class="pen__capa-tit">¡Pasaste a ${RONDAS[st.ronda + 1].t.toLowerCase()}!</p>
      <p class="pen__capa-res">${MI_EQUIPO} ${yo} – ${el} ${st.rivales[st.ronda]}</p>
      <button type="button" class="btn-principal" id="pen-seguir">Siguiente rival</button>`);
    $('#pen-seguir').addEventListener('click', () => { st.ronda++; empezarTanda(); });
    $('#pen-seguir').focus();
  }

  function pantallaFinal(campeon) {
    const resumen = st.camino.map((c) => `<li class="${c.gane ? 'ok' : 'no'}"><span>${c.ronda}</span><strong>${c.yo}–${c.el}</strong><span>${c.rival}</span></li>`).join('');
    const emojis = st.camino.map((c) => (c.gane ? '🟨' : '🟥')).join('') + '⬛'.repeat(RONDAS.length - st.camino.length);
    capa(`
      <p class="pen__capa-tit">${campeon ? '¡CAMPEÓN DE LA COPA!' : `Eliminado en ${st.camino.at(-1).ronda.toLowerCase()}`}</p>
      <p class="pen__capa-pts"><strong>${st.puntos}</strong> puntos</p>
      <ol class="pen__camino">${resumen}</ol>
      <div class="pen__capa-btns">
        <button type="button" class="btn-principal" id="pen-compartir">Compartir</button>
        <button type="button" class="btn-categoria" id="pen-otra">Jugar de nuevo</button>
      </div>`);
    $('#pen-otra').addEventListener('click', reiniciar);
    $('#pen-compartir').addEventListener('click', async () => {
      const texto = `Penales Copa Argentina · Latabla\n${emojis} ${campeon ? '🏆' : ''}\n${st.puntos} puntos\n${location.origin}`;
      try {
        if (navigator.share) await navigator.share({ text: texto });
        else { await navigator.clipboard.writeText(texto); mostrar('Resultado copiado', 1500, 'bien'); }
      } catch { /* cancelado */ }
    });
    $('#pen-otra').focus();
  }

  function reiniciar() {
    Object.assign(st, { ronda: 0, rivales: sembrarRivales(), camino: [], puntos: 0 });
    empezarTanda();
  }

  function empezarTanda() {
    st.mios = []; st.suyos = []; st.turno = 'patear';
    resetearJugada();
    capa(`
      <p class="pen__capa-ronda">${RONDAS[st.ronda].t}</p>
      <p class="pen__capa-tit">${MI_EQUIPO} <span>vs</span> ${st.rivales[st.ronda]}</p>
      <p class="pen__capa-txt">Cinco penales cada uno, alternados. Si empatan, muerte súbita. Pateás primero.</p>
      <button type="button" class="btn-principal" id="pen-empezar">Empezar la tanda</button>`);
    st.fase = 'presentacion';
    pintarMarcador();
    $('#pen-empezar').addEventListener('click', () => { capa(''); siguienteTurno(); });
    $('#pen-empezar').focus();
  }

  /* ---------- Interfaz ---------- */
  function pintarMarcador() {
    const g = (a) => a.filter(Boolean).length;
    $('#pen-el').textContent = st.rivales[st.ronda];
    $('#pen-ronda').textContent = RONDAS[st.ronda].t;
    $('#pen-g-yo').textContent = g(st.mios);
    $('#pen-g-el').textContent = g(st.suyos);
    const serie = (a) => {
      const n = Math.max(5, a.length, st.mios.length, st.suyos.length);
      return Array.from({ length: n }, (_, i) => `<i class="${a[i] === true ? 'g' : a[i] === false ? 'e' : ''}" title="${a[i] === true ? 'Gol' : a[i] === false ? 'Errado' : 'Por patear'}"></i>`).join('');
    };
    $('#pen-s-yo').innerHTML = serie(st.mios);
    $('#pen-s-el').innerHTML = serie(st.suyos);
  }
  const ayuda = (t) => { $('#pen-ayuda').textContent = t; };
  function mostrar(t, ms, tono = '') {
    const m = $('#pen-msg');
    m.textContent = t; m.className = `pen__msg visible ${tono}`;
    clearTimeout(m._t); m._t = setTimeout(() => { m.className = 'pen__msg'; }, ms);
  }
  function capa(html) {
    const c = $('#pen-capa');
    c.innerHTML = html;
    c.classList.toggle('visible', !!html);
  }

  /* ---------- Entrada ---------- */
  function puntoDesdeEvento(ev) {
    const r = cv.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
  }
  cv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (st.fase === 'apuntar') patear();
    else atajar(puntoDesdeEvento(ev));
  });
  const ZONAS = { q: [110, 95], w: [200, 90], e: [290, 95], a: [110, 155], s: [200, 150], d: [290, 155] };
  function tecla(ev) {
    if (!raiz.isConnected) return limpiar();
    if (ev.target.closest('button, input, select, textarea, a')) return;
    const k = ev.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && st.fase === 'apuntar') { ev.preventDefault(); patear(); }
    else if (ZONAS[k]) { ev.preventDefault(); atajar({ x: ZONAS[k][0], y: ZONAS[k][1] }); }
  }
  document.addEventListener('keydown', tecla);

  function limpiar() {
    desmontado = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', tecla);
  }
  // Se detiene solo cuando la página cambia
  const obs = new MutationObserver(() => { if (!raiz.isConnected) { limpiar(); obs.disconnect(); } });
  obs.observe(document.body, { childList: true, subtree: true });

  empezarTanda();
  raf = requestAnimationFrame(bucle);
  return limpiar;
}
