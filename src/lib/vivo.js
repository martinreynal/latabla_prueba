// Tablas en vivo desde /api/tablas (ESPN vía Vercel). Si falla o estamos en la vista previa,
// las páginas siguen usando los resultados cargados a mano o los datos de ejemplo.
const TORNEOS_VIVO = ['primera', 'nacional', 'bmetro'];
const cache = {};

export async function cargarVivo() {
  if (import.meta.env.MODE === 'artifact') return;
  await Promise.all(TORNEOS_VIVO.map(async (t) => {
    try {
      const r = await fetch(`/api/tablas?torneo=${t}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.zonas) cache[t] = d;
    } catch { /* sin conexión: queda el respaldo */ }
  }));
}

export const tablaVivo = (torneo, zona) => cache[torneo]?.zonas?.[zona] || null;
export const datosVivo = (torneo) => cache[torneo] || null;

export function equipoVivo(id) {
  for (const [torneo, d] of Object.entries(cache)) {
    for (const [zona, filas] of Object.entries(d.zonas)) {
      const i = filas.findIndex((e) => e.id === id);
      if (i >= 0) return { torneo, zona, fila: filas[i], pos: i + 1, total: filas.length, actualizado: d.actualizado };
    }
  }
  return null;
}

export function haceCuanto(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return min < 1 ? 'recién' : min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
}
