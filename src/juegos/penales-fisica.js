// Física del penal: pelota en tres dimensiones con paso fijo, colisiones y proyección a pantalla.
// Coordenadas de cancha, en metros: x lateral (0 en el centro del arco), y altura, z profundidad
// (0 en el punto del penal, 11 en la línea de gol). Nada de este archivo dibuja.

export const CANCHA = {
  MEDIO_ARCO: 3.66,   // del centro a la cara interna de cada palo
  ALTO_ARCO: 2.72,    // del piso a la cara inferior del travesaño (en la escala del dibujo)
  LINEA: 11,          // profundidad de la línea de gol
  RADIO_PALO: 0.06,
  RADIO_PELOTA: 0.11,
  FONDO_RED: 1.6,     // profundidad de la red detrás de la línea
  Z_ARQUERO: 10.55,   // plano donde se mueve el arquero
};
export const DT = 1 / 240;           // paso fijo de la simulación, independiente de los cuadros por segundo
const G = 9.8;
const REST = { piso: 0.52, palo: 0.6, red: 0.06 };
// Restitución de cada parte del cuerpo: una palma amortigua, un pie o un antebrazo rebotan más.
const REST_CUERPO = { mano: 0.3, antebrazo: 0.5, brazo: 0.45, torso: 0.22, cabeza: 0.55, muslo: 0.4, pierna: 0.55, pie: 0.62 };

/* ---------- Proyección cancha → pantalla (canvas lógico de 800 × 600) ---------- */
// Cámara en perspectiva detrás del pateador: la escala cae con la profundidad y el piso sube en pantalla.
const ESC0 = 77, PROF = 17.9, HORIZONTE = -29.4, ALTURA_CAM = 6.11, CX = 407.5;
export const escala = (z) => ESC0 / (1 + z / PROF);          // píxeles por metro a profundidad z
export function proyectar(x, y, z) {
  const s = escala(z);
  return { x: CX + x * s, y: HORIZONTE + ALTURA_CAM * s - y * s, s };
}
// Punto del plano del arco que corresponde a un punto de la pantalla (para saber dónde tocó el usuario).
export function pantallaAArco(px, py, z = CANCHA.LINEA) {
  const s = escala(z);
  return { x: (px - CX) / s, y: (HORIZONTE + ALTURA_CAM * s - py) / s };
}

/* ---------- Remate ---------- */
// Velocidad inicial para que una pelota que sale del punto del penal con rapidez v0 pase por (x, y) en la línea.
export function velocidadHacia(obj, v0) {
  const r = CANCHA.RADIO_PELOTA;
  const d = Math.hypot(obj.x, CANCHA.LINEA);
  const altura = (a) => r + d * Math.tan(a) - (G * d * d) / (2 * v0 * v0 * Math.cos(a) ** 2);
  let lo = -0.15, hi = 0.75; // se busca la trayectoria tendida (la más baja de las dos posibles)
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (altura(m) < obj.y) lo = m; else hi = m; }
  const a = (lo + hi) / 2, vh = v0 * Math.cos(a);
  return { x: vh * (obj.x / d), y: v0 * Math.sin(a), z: vh * (CANCHA.LINEA / d) };
}
// Remate con un ángulo de salida fijo (para el globo de un Panenka): rapidez justa para pasar por (x, y) en la línea.
export function velocidadConAngulo(obj, ang) {
  const r = CANCHA.RADIO_PELOTA, d = Math.hypot(obj.x, CANCHA.LINEA);
  const v0 = Math.sqrt((G * d * d) / (2 * Math.cos(ang) ** 2 * (d * Math.tan(ang) - (obj.y - r))));
  const vh = v0 * Math.cos(ang);
  return { x: vh * (obj.x / d), y: v0 * Math.sin(ang), z: vh * (CANCHA.LINEA / d) };
}
export const rapidezDePotencia = (p) => 17 + 14 * p; // m/s: de unos 60 a 110 km/h

export function crearPelota() {
  return {
    x: 0, y: CANCHA.RADIO_PELOTA, z: 0, vx: 0, vy: 0, vz: 0, t: 0, giro: 0,
    enJuego: false,
    gol: false,          // cruzó entera la línea, entre los palos y bajo el travesaño
    afuera: false,       // pasó la línea por fuera del arco
    atrapada: false,     // el arquero la embolsó
    palo: false, toques: [],  // qué tocó: partes del cuerpo del arquero, en orden
    eventos: [],         // eventos del último paso: 'palo', 'travesano', 'red', 'pique', 'cuerpo:<parte>'
    enfriado: {},
  };
}
export function patear(b, vel) {
  Object.assign(b, { x: 0, y: CANCHA.RADIO_PELOTA, z: 0, vx: vel.x, vy: vel.y, vz: vel.z, t: 0, enJuego: true });
}

function rebotar(b, nx, ny, nz, e) {
  const vn = b.vx * nx + b.vy * ny + b.vz * nz;
  if (vn >= 0) return false;
  b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; b.vz -= (1 + e) * vn * nz;
  return true;
}

// Distancia de un punto al segmento a–b (o al punto a si no hay b) en el plano del arquero.
function masCercano(px, py, a, b) {
  if (!b) return { x: a.x, y: a.y };
  const dx = b.x - a.x, dy = b.y - a.y;
  const u = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return { x: a.x + dx * u, y: a.y + dy * u };
}

// Un paso de simulación. partes: lista de { tipo, lado, a, b, r, vx, vy } con el cuerpo del arquero en este instante.
export function pasoPelota(b, partes) {
  const { MEDIO_ARCO: MA, ALTO_ARCO: AA, LINEA, RADIO_PALO: RP, RADIO_PELOTA: r, FONDO_RED, Z_ARQUERO } = CANCHA;
  b.eventos.length = 0;
  if (!b.enJuego || b.atrapada) return;
  b.t += DT;
  b.vy -= G * DT;
  b.x += b.vx * DT; b.y += b.vy * DT; b.z += b.vz * DT;
  b.giro += Math.hypot(b.vx, b.vz) * DT * 2.2;

  // Piso: pique con pérdida de energía y rozamiento al rodar
  if (b.y < r) {
    b.y = r;
    if (b.vy < -0.9) { b.vy = -b.vy * REST.piso; b.vx *= 0.9; b.vz *= 0.9; b.eventos.push('pique'); } else b.vy = 0;
  }
  if (b.y <= r + 0.002 && b.vy === 0) { const f = Math.max(0, 1 - 0.9 * DT); b.vx *= f; b.vz *= f; }

  // Cuerpo del arquero: solo mientras la pelota atraviesa su plano
  if (partes && !b.sinCuerpo && Math.abs(b.z - Z_ARQUERO) < r + 0.2) {
    for (const p of partes) {
      const clave = p.tipo + (p.lado ?? '');
      if (b.t - (b.enfriado[clave] ?? -1) < 0.12) continue;
      const c = masCercano(b.x, b.y, p.a, p.b);
      const dx = b.x - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy), lim = r + p.r;
      if (d >= lim) continue;
      // La normal mira hacia el pateador; un roce (d cerca del límite) desvía más de costado y frena menos.
      // Primer contacto: se avisa (para el error excepcional del arquero). Si la pelota queda retenida, se corta acá.
      if (b.alContacto && !b.contactoVisto) {
        b.contactoVisto = true;
        if (b.alContacto(p, b) === 'escurre') {
          b.atrapada = b.retenida = true; b.vx = b.vy = b.vz = 0; b.toques.push(p.tipo); b.eventos.push(`cuerpo:${p.tipo}`);
          return;
        }
      }
      // Bloqueo asegurado: la toma de frente, sin roces que la desvíen hacia el arco.
      const k = b.asegurar ? 0.1 : 0.12 + 1.25 * (d / lim) ** 2, ux = d > 1e-6 ? dx / d : 0, uy = d > 1e-6 ? dy / d : 0;
      let nx = ux * k, ny = uy * k, nz = -1;
      const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
      const rap = Math.hypot(b.vx, b.vy, b.vz);
      // Embolsada: mano con la otra mano cerca y un remate que no viene demasiado fuerte.
      if (p.tipo === 'mano' && b.asegurar) { b.atrapada = true; b.vx = b.vy = b.vz = 0; b.toques.push('mano'); b.eventos.push('cuerpo:manos'); return; }
      if (p.tipo === 'mano' && p.otraMano && Math.hypot(b.x - p.otraMano.x, b.y - p.otraMano.y) < 0.34 && rap < 19 && d < lim * 0.8) {
        b.atrapada = true; b.vx = b.vy = b.vz = 0; b.toques.push('mano'); b.eventos.push('cuerpo:manos');
        return;
      }
      // Rebote respecto de la parte en movimiento: una mano que va hacia la pelota la empuja.
      b.vx -= p.vx; b.vy -= p.vy;
      let e = REST_CUERPO[p.tipo] ?? 0.4;
      if (p.tipo === 'torso' && rap < 15) e = 0.1; // la bloquea con el cuerpo y queda cerca
      if (b.asegurar) e = Math.max(e, 0.3);
      const pego = rebotar(b, nx, ny, nz, e);
      b.vx += p.vx; b.vy += p.vy;
      if (pego) { b.enfriado[clave] = b.t; b.toques.push(p.tipo); b.eventos.push(`cuerpo:${p.tipo}`); }
    }
  }

  // Palos (cilindros verticales) y travesaño (cilindro horizontal), todos sobre la línea
  if (!b.gol && Math.abs(b.z - LINEA) < r + RP) {
    for (const lado of [-1, 1]) {
      if (b.y > AA + RP) continue;
      const dx = b.x - lado * (MA + RP), dz = b.z - LINEA, d = Math.hypot(dx, dz);
      if (d < r + RP && d > 1e-6) {
        b.x += (dx / d) * (r + RP - d); b.z += (dz / d) * (r + RP - d);
        if (rebotar(b, dx / d, 0, dz / d, REST.palo)) { b.palo = true; b.eventos.push('palo'); }
      }
    }
    if (Math.abs(b.x) < MA + 2 * RP) {
      const dy = b.y - (AA + RP), dz = b.z - LINEA, d = Math.hypot(dy, dz);
      if (d < r + RP && d > 1e-6) {
        b.y += (dy / d) * (r + RP - d); b.z += (dz / d) * (r + RP - d);
        if (rebotar(b, 0, dy / d, dz / d, REST.palo)) { b.palo = true; b.eventos.push('travesano'); }
      }
    }
  }

  // ¿Gol? Tiene que cruzar entera la línea, entre los palos y por debajo del travesaño. Se confirma una sola vez.
  if (!b.gol && !b.afuera && b.z - r > LINEA) {
    if (Math.abs(b.x) < MA && b.y < AA) b.gol = true; else b.afuera = true;
  }
  // Red: frena la pelota contra el fondo, los costados y el techo
  if (b.gol) {
    const tope = (cond, fn) => { if (cond) { fn(); b.vx *= 0.55; b.vy *= 0.7; b.vz *= 0.55; b.eventos.push('red'); } };
    tope(b.z > LINEA + FONDO_RED - r && b.vz > 0, () => { b.z = LINEA + FONDO_RED - r; b.vz = -b.vz * REST.red; });
    tope(b.x > MA - r && b.vx > 0, () => { b.x = MA - r; b.vx = -b.vx * REST.red; });
    tope(b.x < -MA + r && b.vx < 0, () => { b.x = -MA + r; b.vx = -b.vx * REST.red; });
    tope(b.y > AA - r && b.vy > 0, () => { b.y = AA - r; b.vy = -b.vy * REST.red; });
    if (b.z < LINEA + r && b.vz < 0) { b.z = LINEA + r; b.vz = 0; } // ya adentro, no vuelve a salir
  }
}

// ¿Ya no puede cambiar el resultado? (para cerrar el penal sin esperar de más)
export function definida(b) {
  if (b.retenida) return false;              // la tiene en las manos, pero todavía se le puede escapar
  if (b.gol || b.atrapada) return true;
  if (b.afuera && b.z > CANCHA.LINEA + 1.2) return true;
  const rap = Math.hypot(b.vx, b.vy, b.vz);
  if (b.t > 0.25 && rap < 0.5 && b.y <= CANCHA.RADIO_PELOTA + 0.01) return true;   // quedó quieta
  if (b.vz < -0.3 && b.t > 0.1) return true;                                        // vuelve hacia la cancha: ya no puede entrar
  return b.t > 4;
}
// Resultado del penal a partir de lo que pasó físicamente.
export function resultado(b) {
  if (b.gol) return 'gol';
  if (b.toques.length) return 'atajada';
  return b.palo ? 'palo' : 'afuera';
}

// La pelota que el arquero tenía se le escapa hacia atrás, por debajo del cuerpo, y sigue rodando hacia el arco.
export function escaparse(b) {
  Object.assign(b, { atrapada: false, retenida: false, sinCuerpo: true, y: Math.max(CANCHA.RADIO_PELOTA, Math.min(b.y, 0.3)) });
  b.vx = Math.sign(b.x) * 0.9; b.vy = 0.6; b.vz = 3.0;   // sale por la punta de los guantes, hacia el fondo del arco
}

// Por dónde y cuándo va a pasar un remate a la altura del arquero, si nadie lo toca.
export function cruce(vel) {
  const b = crearPelota();
  patear(b, vel);
  while (b.z < CANCHA.Z_ARQUERO && b.t < 3) pasoPelota(b, null);
  return { x: b.x, y: b.y, t: b.t };
}
