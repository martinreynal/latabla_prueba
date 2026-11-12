// Recorre las notas de afa.com.ar con resultados de Reserva (Torneo Proyección) y juveniles,
// guarda lo leído en data/afa/cache.json y genera src/data/afa.json para el sitio.
// Uso: node scripts/afa/actualizar.mjs            (diario: primeras páginas de cada listado)
//      AFA_COMPLETO=1 node scripts/afa/actualizar.mjs  (recorre toda la temporada)
import fs from 'node:fs/promises';
import { leerNota, partidosDeNota } from './leer.mjs';
import { identificar, CLUBES_LPF } from './clubes.mjs';

const BASE = 'https://www.afa.com.ar/es/posts/';
const UA = 'Mozilla/5.0 (compatible; LatablaBot/1.0; sitio sin fines comerciales; +https://latabla-prueba.vercel.app)';
const CACHE = 'data/afa/cache.json';
const SALIDA = 'src/data/afa.json';
const TEMPORADA = '2026';
const completo = process.env.AFA_COMPLETO === '1';
const sinRed = process.env.AFA_SIN_RED === '1'; // solo rearma src/data/afa.json desde la caché
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const INTERES = /proyecc|royeccion|reserva|juvenil|inferior/i;

async function bajar(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
    } catch { /* reintento */ }
    await esperar(3000);
  }
  return null;
}

// ---------- 1. Descubrir notas ----------
const LISTADOS = [['Noticias', completo ? 400 : 6], ['Fútbol Juvenil', completo ? 60 : 3], ['reserva', completo ? 60 : 3], ['Reserva LPF', completo ? 60 : 3], ['Inferiores', completo ? 60 : 3], ['Torneos', completo ? 100 : 3]];
const slugs = new Set();
for (const [cat, max] of sinRed ? [] : LISTADOS) {
  let vacias = 0;
  for (let p = 1; p <= max; p++) {
    const html = await bajar(`${BASE}?s=${encodeURIComponent(cat)}&page=${p}`);
    await esperar(400);
    const nuevos = [...(html ?? '').matchAll(/href="https:\/\/www\.afa\.com\.ar\/es\/posts\/([^"?#/]+)"/g)].map((m) => m[1]);
    const antes = slugs.size;
    nuevos.filter((s) => INTERES.test(s) && !/femen/i.test(s)).forEach((s) => slugs.add(s));
    // Si el listado ya llega a la temporada anterior, cortamos.
    if (html && /\b20(1\d|2[0-5])\b.{0,40}(Torneo Proyecci|Juveniles)/.test(html) && completo && cat === 'Noticias' && p > 200) break;
    vacias = nuevos.length === 0 ? vacias + 1 : 0;
    if (vacias >= 3) break;
    if (!completo && slugs.size === antes && p > 2) break;
  }
  console.log(`listado ${cat}: ${slugs.size} notas de interés acumuladas`);
}

// ---------- 2. Leer las notas (con caché) ----------
await fs.mkdir('data/afa', { recursive: true });
const cache = JSON.parse(await fs.readFile(CACHE, 'utf8').catch(() => '{}'));
const hoy = new Date();
const reciente = (dia) => dia && (hoy - new Date(dia)) / 864e5 < 30;
let leidas = 0;
for (const slug of slugs) {
  if (sinRed) break;
  const c = cache[slug];
  const incompleta = c && c.partidos.some((p) => p.gl === null && reciente(p.dia));
  if (c && !incompleta) continue;
  const html = await bajar(BASE + slug);
  await esperar(500);
  if (!html) continue;
  const nota = leerNota(html);
  cache[slug] = { titulo: nota.titulo, partidos: partidosDeNota(nota), leida: hoy.toISOString() };
  leidas++;
}
await fs.writeFile(CACHE, `${JSON.stringify(cache)}\n`);
console.log(`notas leídas hoy: ${leidas} · en caché: ${Object.keys(cache).length}`);

// ---------- 3. Armar los datos del sitio ----------
const sinIdentificar = new Set();
const unicos = new Map();
const orden = Object.entries(cache).sort(([, a], [, b]) => {
  const max = (n) => n.partidos.reduce((m, p) => (p.dia > m ? p.dia : m), '');
  return max(a).localeCompare(max(b)) || /finaliz|termin|complet/i.test(a.titulo) - /finaliz|termin|complet/i.test(b.titulo);
});
for (const [slug, nota] of orden) {
  for (const p of nota.partidos) {
    if (!p.dia?.startsWith(TEMPORADA)) continue;
    if (p.tipo !== 'reserva' && p.tipo !== 'juv-lpf') continue;
    const l = identificar(p.local);
    const v = identificar(p.visitante);
    if (!l) sinIdentificar.add(p.local);
    if (!v) sinIdentificar.add(p.visitante);
    if (!l || !v || l.id === v.id) continue;
    const fase = p.tipo === 'reserva' ? (p.dia < `${TEMPORADA}-07-01` ? 'apertura' : 'clausura') : 'anual';
    const clave = [p.tipo, fase, p.cat, ...[l.id, v.id].sort()].join('|');
    const previo = unicos.get(clave);
    if (previo && p.gl === null && previo.gl !== null) continue; // no pisar un resultado con uno vacío
    const num = typeof p.fecha === 'number' ? p.fecha : (previo?.fecha ?? null);
    const inter = p.fecha === 'interzonal' || Boolean(previo?.inter);
    unicos.set(clave, { tipo: p.tipo, fase, cat: p.cat, fecha: num, inter, dia: p.dia, l: l.id, v: v.id, gl: p.gl, gv: p.gv, slug });
  }
}

// Zonas del Proyección: grupos de clubes que se enfrentan entre sí (sin contar interzonales).
function componentes(partidos) {
  const vecinos = new Map();
  for (const p of partidos) {
    for (const [a, b] of [[p.l, p.v], [p.v, p.l]]) (vecinos.get(a) ?? vecinos.set(a, new Set()).get(a)).add(b);
  }
  const grupo = {};
  let n = 0;
  for (const inicio of [...vecinos.keys()].sort()) {
    if (grupo[inicio] !== undefined) continue;
    const pila = [inicio];
    while (pila.length) { const x = pila.pop(); if (grupo[x] !== undefined) continue; grupo[x] = n; pila.push(...vecinos.get(x)); }
    n++;
  }
  return { grupo, n };
}
function zonas(partidos) {
  const base = partidos.filter((p) => !p.inter);
  let { grupo, n } = componentes(base);
  if (n === 1) {
    // Hay una fecha interzonal sin marcar en el título: la que, al sacarla, deja dos zonas del mismo tamaño.
    const fechas = [...new Set(base.map((p) => p.fecha))];
    for (const f of fechas) {
      const prueba = componentes(base.filter((p) => p.fecha !== f));
      const tam = Object.values(prueba.grupo).reduce((m, g) => ((m[g] = (m[g] ?? 0) + 1), m), {});
      if (prueba.n === 2 && tam[0] === tam[1]) {
        partidos.filter((p) => p.fecha === f).forEach((p) => { p.inter = true; });
        ({ grupo, n } = prueba);
        break;
      }
    }
  }
  if (n !== 2) return null; // formato desconocido: el sitio muestra una tabla única
  return Object.fromEntries(Object.entries(grupo).map(([id, g]) => [id, 'AB'[g]]));
}

const comp = (p) => [p.inter ? 'interzonal' : p.fecha, p.dia, p.l, p.v, p.gl, p.gv];
// Número de fecha que ocupó la interzonal (el más repetido entre sus partidos).
const numeroInterzonal = (ps) => {
  const c = {};
  ps.filter((p) => p.inter && typeof p.fecha === 'number').forEach((p) => { c[p.fecha] = (c[p.fecha] ?? 0) + 1; });
  return +Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};
const todos = [...unicos.values()];
const out = { actualizado: hoy.toISOString(), fuente: 'afa.com.ar', clubes: CLUBES_LPF, reserva: {}, juveniles: {}, sinIdentificar: [...sinIdentificar].sort() };
for (const fase of ['apertura', 'clausura']) {
  const ps = todos.filter((p) => p.tipo === 'reserva' && p.fase === fase).sort((a, b) => a.dia.localeCompare(b.dia));
  const z = zonas(ps);
  out.reserva[fase] = { zonas: z, fechaInterzonal: numeroInterzonal(ps), partidos: ps.map(comp) };
}
for (const cat of ['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena']) {
  out.juveniles[cat] = todos.filter((p) => p.tipo === 'juv-lpf' && p.cat === cat).sort((a, b) => a.dia.localeCompare(b.dia)).map(comp);
}
await fs.writeFile(SALIDA, `${JSON.stringify(out)}\n`);
const cuenta = (l) => `${l.length} partidos (${l.filter((p) => p[4] !== null).length} con resultado)`;
console.log(`Reserva Apertura: ${cuenta(out.reserva.apertura.partidos)} · Clausura: ${cuenta(out.reserva.clausura.partidos)}`);
console.log(`Juveniles 4.ª: ${cuenta(out.juveniles.cuarta)} · 9.ª: ${cuenta(out.juveniles.novena)}`);
console.log(`Sin identificar: ${out.sinIdentificar.join(', ') || 'ninguno'}`);
