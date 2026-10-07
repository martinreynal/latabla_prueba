// Estado del día de cada juego, guardado en el navegador.
// Más adelante se sincroniza con Supabase para usuarios con cuenta.
const hoy = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local

function leer() {
  try {
    const data = JSON.parse(localStorage.getItem('latabla:progreso') || '{}');
    return data.fecha === hoy() ? data : { fecha: hoy(), juegos: {} };
  } catch {
    return { fecha: hoy(), juegos: {} };
  }
}

export function estadoJuego(slug) {
  return leer().juegos[slug] || 'pendiente'; // 'pendiente' | 'resuelto' | 'fallado'
}

export function guardarEstado(slug, estado) {
  const data = leer();
  data.juegos[slug] = estado;
  try { localStorage.setItem('latabla:progreso', JSON.stringify(data)); } catch {}
}
