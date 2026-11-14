// Lee las rondas eliminatorias del Torneo Regional Federal Amateur 2026 desde ascensodelinterior.com.ar
// (páginas de resultados en texto) y genera src/data/regional-llaves.json.
// Uso: node scripts/adi/regional.mjs           (baja las páginas)
//      ADI_LOCAL=<carpeta> node ...            (lee archivos r-<id>.html ya bajados, para probar)
import fs from 'node:fs/promises';

const B = 'https://www.ascensodelinterior.com.ar';
const UA = 'Mozilla/5.0 (compatible; LatablaBot/1.0; sitio sin fines comerciales; +https://latabla-prueba.vercel.app)';
const SALIDA = 'src/data/regional-llaves.json';
const LOCAL = process.env.ADI_LOCAL;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function bajar(id, slug) {
  if (LOCAL) return fs.readFile(`${LOCAL}/r-${id}.html`, 'utf8').catch(() => null);
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(`${B}/tdi/resultados/${id}/${slug}/`, { headers: { 'User-Agent': UA } }); if (r.ok) return await r.text(); } catch { /* reintento */ }
    await esperar(3000);
  }
  return null;
}

const ENT = { amp: '&', nbsp: ' ', quot: '"', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü' };
const limpiar = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-zA-Z]+);/g, (m, n) => ENT[n] ?? m).replace(/[\s ]+/g, ' ').trim();
const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const REGIONES = [['NORTE', 'Norte'], ['LITORAL NORTE', 'Litoral Norte'], ['LITORAL SUR', 'Litoral Sur'], ['CENTRO', 'Centro'], ['CUYO', 'Cuyo'], ['PAMPEANA NORTE', 'Pampeana Norte'], ['PAMPEANA SUR', 'Pampeana Sur'], ['PATAGONI', 'Patagonia']];
function region(titulo) {
  const t = sinTilde(titulo).replace(/^REGION\s+/, '');
  return (REGIONES.find(([k]) => t === k) ?? REGIONES.find(([k]) => t.startsWith(k)))?.[1] ?? null;
}
const num = (x) => (/^\d+$/.test(x) ? +x : null);
// Cuántas palabras comparten dos nombres (para saber a cuál de los dos se refiere "CLASIFICÓ").
const palabras = (s) => new Set(sinTilde(s ?? '').replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2));
const parecido = (x, y) => { const a = palabras(x), b = palabras(y); return [...a].filter((w) => b.has(w)).length; };

// Rondas disponibles: las opciones "TORNEO REGIONAL 2026 - ... RONDA" del selector de la página.
function rondasDelSelector(html) {
  return [...html.matchAll(/<option value="([^"]+)_(\d+)"[^>]*>([^<]+)<\/option>/g)]
    .map(([, slug, id, t]) => ({ id: +id, slug, titulo: limpiar(t) }))
    .filter((r) => /TORNEO REGIONAL 2026/i.test(r.titulo) && !/FECHA/i.test(r.titulo));
}

function leerRonda(html) {
  const tablas = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  const t = tablas.sort((a, b) => b.length - a.length)[0] ?? '';
  const out = {};
  let reg = null, serie = null;
  for (const tr of t.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const c = (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(limpiar);
    if (c.length === 1) {
      if (/^REGI[OÓ]N/i.test(c[0])) { reg = region(c[0]); serie = null; if (reg) out[reg] ??= []; }
      else if (/^PLAY ?OFF/i.test(c[0]) && reg) { serie = { n: +(c[0].match(/\d+/)?.[0] ?? out[reg].length + 1), partidos: [], clasifico: null, global: null, penales: null, conTitulo: true }; out[reg].push(serie); }
      continue;
    }
    if (c.length >= 7 && /^(Ida|[ÚU]nico)$/i.test(c[0]) && reg && (!serie || serie.partidos.length || !serie.conTitulo)) {
      // Algunas regiones no tienen el encabezado "PLAY OFF": cada ida nueva abre una serie.
      serie = { n: out[reg].length + 1, partidos: [], clasifico: null, global: null, penales: null };
      out[reg].push(serie);
    }
    if (!serie) continue;
    if (c.length >= 7 && /^(Ida|Vuelta|[ÚU]nico)$/i.test(c[0])) {
      serie.partidos.push({ tipo: c[0], local: c[1], visitante: c[5], gl: num(c[2]), gv: num(c[4]), estado: c[6] || null });
    } else if (c.length >= 2 && /CLASIFIC/i.test(c[1])) {
      const m = c[1].match(/CLASIFIC[OÓ]:\s*(.+?)\s*GLOBAL:\s*(\d+)\s*-\s*(\d+)(?:.*?Penales:\s*\(?(\d+)\s*-\s*(\d+))?/i);
      if (m) Object.assign(serie, { clasifico: m[1].trim(), global: [+m[2], +m[3]], penales: m[4] ? [+m[4], +m[5]] : null });
      else serie.clasifico = c[1].replace(/CLASIFIC[OÓ]:\s*/i, '').trim();
    }
  }
  // Equipos de la serie según la ida (el primero es el local de la ida).
  for (const lista of Object.values(out)) for (const s of lista) {
    const ida = s.partidos[0];
    s.a = ida?.local ?? null; s.b = ida?.visitante ?? null;
    delete s.conTitulo;
    // Global calculado con los partidos (el sitio lo escribe con el clasificado primero).
    const jugados = s.partidos.filter((p) => p.gl !== null && p.gv !== null);
    const goles = (eq) => jugados.reduce((n, p) => n + (p.local === eq ? p.gl : p.visitante === eq ? p.gv : 0), 0);
    const ga = goles(s.a), gb = goles(s.b);
    s.global = jugados.length ? [ga, gb] : null;
    s.ganador = null;
    if (s.clasifico) {
      if (ga !== gb && jugados.length === s.partidos.length) s.ganador = ga > gb ? 'a' : 'b';
      else s.ganador = parecido(s.clasifico, s.a) >= parecido(s.clasifico, s.b) ? 'a' : 'b';
      if (s.penales && s.ganador === 'b') s.penales = [s.penales[1], s.penales[0]];
    }
  }
  return out;
}

const base = await bajar(219, 'torneo-regional-2026---tercera-ronda-(ida-y-vuelta)');
if (!base) { console.error('No se pudo bajar la página base'); process.exit(LOCAL ? 0 : 1); }
const rondas = [];
for (const r of rondasDelSelector(base).sort((a, b) => a.id - b.id)) {
  const html = r.id === 219 ? base : await bajar(r.id, r.slug);
  if (!html) { console.log(`sin datos: ${r.titulo}`); continue; }
  const nombre = r.titulo.replace(/TORNEO REGIONAL 2026\s*-\s*/i, '').replace(/\s*\(.*\)\s*$/, '').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  const regiones = leerRonda(html);
  const series = Object.values(regiones).flat();
  rondas.push({ id: r.id, nombre, regiones });
  console.log(`${nombre}: ${series.length} series · ${series.filter((s) => s.clasifico).length} definidas`);
  if (!LOCAL) await esperar(800);
}
const previo = JSON.parse(await fs.readFile(SALIDA, 'utf8').catch(() => 'null'));
const datos = { fuente: 'ascensodelinterior.com.ar', rondas };
if (previo && JSON.stringify(previo.rondas) === JSON.stringify(rondas)) { console.log('sin cambios'); process.exit(0); }
await fs.writeFile(SALIDA, `${JSON.stringify({ actualizado: new Date().toISOString(), ...datos })}\n`);
