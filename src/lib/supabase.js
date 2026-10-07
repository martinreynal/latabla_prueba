import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si todavía no configuraste .env.local, el sitio funciona igual sin base de datos.
export const supabase = url && key ? createClient(url, key) : null;

if (!supabase && import.meta.env.DEV) {
  console.info('[Latabla] Supabase sin configurar: copiá .env.example como .env.local para conectarlo.');
}
