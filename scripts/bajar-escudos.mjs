// Baja los escudos de los clubes y los deja en public/escudos/<id>.png (128×128, fondo transparente).
// Corre en GitHub Actions (.github/workflows/escudos.yml), donde hay salida a internet.
// Fuentes: ESPN (Primera, Nacional, Primera B) y TheSportsDB (Federal A).
// Genera src/data/escudos.json con { id: 'archivo.png' } para que el sitio sepa cuáles hay.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { CLUBES_FEDERAL } from '../src/data/federal-real.js';

const DIR = 'public/escudos';
const MANIFIESTO = 'src/data/escudos.json';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const manifiesto = JSON.parse(await fs.readFile(MANIFIESTO, 'utf8').catch(() => '{}'));
const log = [];

async function guardar(id, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true }).toFile(`${DIR}/${id}.png`);
  manifiesto[id] = `${id}.png`;
}

// ---------- ESPN ----------
for (const liga of ['arg.1', 'arg.2', 'arg.3']) {
  const json = await (await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${liga}/standings`)).json();
  const grupos = json.children?.length ? json.children : [json];
  for (const g of grupos) {
    for (const e of g.standings?.entries ?? []) {
      const id = `espn-${e.team.id}`;
      const url = e.team.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/soccer/500/${e.team.id}.png`;
      try { await guardar(id, url); log.push(`ok   ${id} ${e.team.displayName}`); }
      catch (err) { log.push(`FALLA ${id} ${e.team.displayName}: ${err.message}`); }
    }
  }
}

// ---------- Federal A (TheSportsDB, clave pública de prueba) ----------
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const BUSQUEDA = {
  'fed-gimnasia-y-esgrima-chivilcoy': ['Gimnasia y Esgrima Chivilcoy', 'Gimnasia Chivilcoy'],
  'fed-defensores-de-belgrano-vr': ['Defensores de Belgrano Villa Ramallo', 'Defensores de Belgrano VR'],
  'fed-9-de-julio-rafaela': ['9 de Julio Rafaela', '9 de Julio'],
  'fed-independiente-chivilcoy': ['Independiente Chivilcoy'],
  'fed-san-martin-formosa': ['San Martin Formosa', 'San Martín de Formosa'],
  'fed-bartolome-mitre-posadas': ['Bartolome Mitre', 'Bartolomé Mitre'],
  'fed-sarmiento-la-banda': ['Sarmiento La Banda', 'Sarmiento de La Banda'],
  'fed-defensores-pto-vilelas': ['Defensores Puerto Vilelas', 'Defensores de Vilelas'],
  'fed-boca-unidos-corrientes': ['Boca Unidos'],
  'fed-sarmiento-resistencia': ['Sarmiento Resistencia', 'Sarmiento de Resistencia'],
  'fed-argentino-monte-maiz': ['Argentino Monte Maiz', 'Argentino de Monte Maíz'],
  'fed-atenas-rio-cuarto': ['Atenas Rio Cuarto', 'Atenas'],
  'fed-huracan-las-heras': ['Huracan Las Heras', 'Huracán Las Heras'],
  'fed-fundacion-amigos-por-el-deporte': ['Fundacion Amigos por el Deporte', 'FADEP'],
  'fed-san-martin-mendoza': ['San Martin Mendoza', 'San Martín de Mendoza'],
  'fed-costa-brava-general-pico': ['Costa Brava'],
  'fed-juventud-unida-san-luis': ['Juventud Unida Universitario', 'Juventud Unida San Luis'],
  'fed-kimberley-mar-del-plata': ['Kimberley', 'Kimberley Mar del Plata'],
  'fed-guillermo-brown': ['Guillermo Brown'],
};
async function buscar(t) {
  for (let intento = 1; intento <= 4; intento++) {
    const r = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(t)}`);
    if (r.ok) {
      const texto = await r.text();
      try { return (JSON.parse(texto).teams ?? []).filter((x) => x.strSport === 'Soccer' && x.strCountry === 'Argentina' && x.strBadge); } catch { /* respuesta no JSON: límite */ }
    }
    console.log(`límite de TheSportsDB (${r.status}) buscando "${t}", espero 65 s`);
    await esperar(65000);
  }
  return [];
}
for (const c of CLUBES_FEDERAL) {
  if (manifiesto[c.id]) continue; // ya descargado
  const terminos = BUSQUEDA[c.id] ?? [c.nombre.replace(/\s*\(.*\)/, '')];
  let elegido = null;
  for (const t of terminos) {
    const lista = await buscar(t);
    await esperar(4000); // la clave pública admite pocas consultas por minuto
    elegido = lista.find((x) => /federal/i.test(x.strLeague ?? '')) ?? lista.find((x) => norm(x.strTeam) === norm(t)) ?? null;
    if (elegido) break;
  }
  if (!elegido) { log.push(`FALTA ${c.id} ${c.nombre}`); continue; }
  try { await guardar(c.id, elegido.strBadge); log.push(`ok   ${c.id} ${c.nombre} ← ${elegido.strTeam} (${elegido.strLeague})`); }
  catch (err) { log.push(`FALLA ${c.id} ${c.nombre}: ${err.message}`); }
}

const ordenado = Object.fromEntries(Object.entries(manifiesto).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(MANIFIESTO, `${JSON.stringify(ordenado, null, 2)}\n`);
await fs.writeFile(`${DIR}/informe.txt`, `${log.join('\n')}\n`);
console.log(log.join('\n'));
console.log(`\n${Object.keys(ordenado).length} escudos en total`);
