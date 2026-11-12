// Utilidades compartidas por las funciones de la API (corren en el servidor de Vercel).
import { createClient } from '@supabase/supabase-js';

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

// La API es privada: exige el token configurado en LATABLA_API_TOKEN.
export function autorizado(req) {
  const esperado = process.env.LATABLA_API_TOKEN;
  if (!esperado || esperado.length < 24) return false;
  const recibido = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (recibido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return dif === 0;
}

// Cliente con la clave de servicio: solo existe en el servidor, nunca en el navegador.
export function supabaseServidor() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel');
  return createClient(url, key, { auth: { persistSession: false } });
}
