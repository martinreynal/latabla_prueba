// POST /api/resultados
// Body: { torneo, zona, fecha, lineas: ["Ferro 2-1 Morón", ...], confirmar: false|true }
// Con confirmar=false devuelve cómo interpretó cada línea, sin guardar.
// Con confirmar=true guarda en Supabase las líneas válidas.
import { torneoPorId } from '../src/data/torneos-carga.js';
import { interpretar } from '../src/lib/emparejar.js';
import { cors, autorizado, supabaseServidor } from './_lib.js';

export function revisar({ torneo, zona, fecha, lineas }) {
  const t = torneoPorId(torneo);
  if (!t) return { error: 'Torneo desconocido' };
  const z = t.zonas.find((x) => x.id === zona);
  if (!z) return { error: 'Zona desconocida' };
  const n = Number(fecha);
  if (!Number.isInteger(n) || n < 1 || n > 60) return { error: 'Número de fecha inválido' };
  if (!Array.isArray(lineas) || !lineas.length || lineas.length > 60) return { error: 'Mandá entre 1 y 60 líneas' };

  const filas = interpretar(lineas.map(String).join('\n'), z.equipos);
  const usados = new Set();
  const revisadas = filas.map((f) => {
    if (f.error) return { linea: f.linea, error: f.error };
    if (f.local.id === f.visitante.id) return { linea: f.linea, error: 'El mismo equipo en los dos lados' };
    if (f.gl > 30 || f.gv > 30) return { linea: f.linea, error: 'Goles fuera de rango' };
    if (usados.has(f.local.id) || usados.has(f.visitante.id)) return { linea: f.linea, error: 'Un equipo aparece dos veces en esta fecha' };
    usados.add(f.local.id); usados.add(f.visitante.id);
    return { linea: f.linea, local: f.local, visitante: f.visitante, gl: f.gl, gv: f.gv };
  });
  return { torneo, zona, fecha: n, filas: revisadas };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' });
  if (!autorizado(req)) return res.status(401).json({ error: 'Token inválido' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const r = revisar(body);
  if (r.error) return res.status(400).json(r);
  if (!body.confirmar) return res.status(200).json(r);

  const validas = r.filas.filter((f) => !f.error);
  if (!validas.length) return res.status(400).json({ error: 'No hay líneas válidas para guardar', ...r });
  try {
    const db = supabaseServidor();
    const { error } = await db.from('partidos').upsert(validas.map((f) => ({
      torneo: r.torneo, zona: r.zona, fecha: r.fecha,
      local_id: f.local.id, visitante_id: f.visitante.id, goles_local: f.gl, goles_visitante: f.gv,
    })), { onConflict: 'torneo,zona,fecha,local_id,visitante_id' });
    if (error) throw new Error(error.message);
    return res.status(200).json({ ...r, guardados: validas.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
