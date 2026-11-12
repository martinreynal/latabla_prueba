// Exploración: busca notas de Primera B, Primera C y Promocional en afa.com.ar,
// baja las imágenes del cuerpo y deja todo en explorar-img/ para analizar.
import fs from 'node:fs/promises';
import { leerNota } from './leer.mjs';
const BASE = 'https://www.afa.com.ar/es/posts/';
const UA = 'Mozilla/5.0 (compatible; LatablaBot/1.0; sitio sin fines comerciales)';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const bajar = async (u, bin = false) => { try { const r = await fetch(u, { headers: { 'User-Agent': UA } }); if (!r.ok) return null; return bin ? Buffer.from(await r.arrayBuffer()) : await r.text(); } catch { return null; } };
const INTERES = /primera-b|primera-c|promocional|ascenso|metropolitana|tercera-de/i;
const FUERA = /femen|playa|futsal|f-tsal/i;
const slugs = new Set();
for (let p = 1; p <= 300; p++) {
  const html = await bajar(`${BASE}?s=Noticias&page=${p}`);
  await esperar(300);
  if (!html) continue;
  for (const m of html.matchAll(/href="https:\/\/www\.afa\.com\.ar\/es\/posts\/([^"?#/]+)"/g)) if (INTERES.test(m[1]) && !FUERA.test(m[1])) slugs.add(m[1]);
}
console.log('notas', slugs.size);
await fs.mkdir('explorar-img', { recursive: true });
const indice = [];
for (const slug of slugs) {
  const html = await bajar(BASE + slug); await esperar(300);
  if (!html) continue;
  const { titulo } = leerNota(html);
  const i = html.search(/<h1/); let cuerpo = html.slice(i);
  const f = cuerpo.search(/>\s*Siguiente\s*</); if (f > 0) cuerpo = cuerpo.slice(0, f);
  const pub = (html.match(/(\d{2}\/\d{2}\/\d{4})/) ?? [])[1] ?? null;
  const imgs = [...new Set([...cuerpo.matchAll(/https:\/\/assets1\.afa\.com\.ar\/[^"'\s)]+\.(?:jpe?g|png|webp)/gi)].map((m) => m[0]))]
    .filter((u) => !/sponsor|logo|statics|copita|gemini|lexar|poster/i.test(u));
  const archivos = [];
  for (const [n, u] of imgs.entries()) {
    const b = await bajar(u, true); await esperar(300);
    if (!b) continue;
    const nombre = `${slug.slice(0, 60)}-${n}${u.match(/\.\w+$/)[0].toLowerCase()}`;
    await fs.writeFile(`explorar-img/${nombre}`, b);
    archivos.push({ url: u, archivo: nombre });
  }
  indice.push({ slug, titulo, pub, archivos });
}
await fs.writeFile('explorar-img/indice.json', JSON.stringify(indice, null, 1));
