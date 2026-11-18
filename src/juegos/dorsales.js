// Nómina de pateadores de cada equipo: dorsales, arquero, orden de ejecución y easter eggs por dorsal.
// Toda la configuración de números y probabilidades vive acá. Nada de este archivo dibuja.

export const DORSALES = {
  jugadoresDeCampo: 10,
  // Pesos relativos por dorsal (no son porcentajes). Se eligen sin reposición dentro de cada equipo.
  niveles: [
    { nivel: 'muy frecuentes', peso: 100, numeros: [9, 10, 11, 8, 7, 18, 20, 21, 22, 5, 6, 3, 19, 23] },
    { nivel: 'frecuentes', peso: 55, numeros: [4, 13, 14, 15, 16, 24, 25, 26, 27, 28, 29, 30, 32] },
    { nivel: 'poco frecuentes', peso: 20, numeros: [31, 17, 33, 34, 35] },
    { nivel: 'muy poco frecuentes', peso: 5, numeros: [36, 37, 38, 39, 80, 99, 74] },
    { nivel: 'extremadamente infrecuentes', peso: 1, numeros: [78, 86] },
  ],
  // Reservados para el arquero; los jugadores de campo nunca los usan.
  arquero: [[1, 0.92], [12, 0.08]],
  // Lugar del arquero en el orden de pateadores (1 = primero).
  posicionArquero: [[11, 0.95], [10, 0.03], [5, 0.02]],
};

// Comportamientos especiales asociados a un dorsal. Para sumar otro, se agrega una entrada.
//   equipo: 'rival' | 'yo' | 'ambos' · prob: probabilidad por ejecución · remate: tipo de remate que fuerza
export const EASTER_EGGS_DORSAL = {
  13: { equipo: 'rival', prob: 0.13, remate: 'panenka' },
};

function sortearPeso(lista, rnd) {
  let r = rnd() * lista.reduce((s, [, p]) => s + p, 0);
  for (const [valor, p] of lista) { if ((r -= p) < 0) return valor; }
  return lista[lista.length - 1][0];
}

// Selección aleatoria ponderada sin reposición.
export function sortearDorsales(n, rnd = Math.random) {
  const bolsa = DORSALES.niveles.flatMap((nv) => nv.numeros.map((d) => [d, nv.peso]));
  const salen = [];
  for (let i = 0; i < n && bolsa.length; i++) {
    const d = sortearPeso(bolsa, rnd);
    salen.push(d);
    bolsa.splice(bolsa.findIndex(([x]) => x === d), 1);
  }
  return salen;
}

function mezclar(lista, rnd) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return l;
}

// Arma la nómina de un equipo para un partido: 10 jugadores de campo y el arquero, con su orden de ejecución.
export function generarNomina(equipoId, rnd = Math.random) {
  const campo = sortearDorsales(DORSALES.jugadoresDeCampo, rnd).map((d) => ({ id: `${equipoId}#${d}`, dorsal: d, arquero: false }));
  const arquero = { id: `${equipoId}#arq`, dorsal: sortearPeso(DORSALES.arquero, rnd), arquero: true };
  const pos = sortearPeso(DORSALES.posicionArquero, rnd);
  const orden = mezclar(campo, rnd).map((j) => j.id);
  orden.splice(pos - 1, 0, arquero.id);
  return { equipo: equipoId, jugadores: [...campo, arquero], arquero: { id: arquero.id, dorsal: arquero.dorsal }, orden, siguiente: 0 };
}

// Quién patea la ejecución número n (desde 0) de ese equipo. Después de las 11 primeras, el orden vuelve a empezar.
export function pateadorDe(nomina, n) {
  const id = nomina.orden[n % nomina.orden.length];
  return nomina.jugadores.find((j) => j.id === id);
}

// ¿Este pateador activa algún easter egg? Se sortea una sola vez por ejecución (quien llama guarda el resultado).
export function easterEggDorsal(jugador, equipo, rnd = Math.random) {
  const egg = EASTER_EGGS_DORSAL[jugador.dorsal];
  if (!egg || (egg.equipo !== 'ambos' && egg.equipo !== equipo)) return null;
  return rnd() < egg.prob ? egg.remate : null;
}
