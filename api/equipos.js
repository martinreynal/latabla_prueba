// GET /api/equipos → torneos que se pueden cargar, con sus zonas y equipos.
import { TORNEOS_CARGA } from '../src/data/torneos-carga.js';
import { cors, autorizado } from './_lib.js';

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!autorizado(req)) return res.status(401).json({ error: 'Token inválido' });
  res.status(200).json({ torneos: TORNEOS_CARGA.map(({ id, nombre, zonas }) => ({ id, nombre, zonas })) });
}
