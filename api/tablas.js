// GET /api/tablas?torneo=primera|nacional|bmetro
// Lee las posiciones del endpoint público de ESPN (sin clave) y las devuelve en el formato de Latabla.
// Vercel guarda la respuesta en caché 10 minutos: ESPN recibe como mucho una consulta cada 10 minutos
// por torneo, sin importar cuántas personas visiten el sitio.
// Ojo: es un endpoint no oficial ni documentado. Puede cambiar sin aviso y no está licenciado para uso comercial.

const FUENTES = {
  primera: { liga: 'arg.1', zonas: { 'Group A': 'A', 'Group B': 'B' } },
  nacional: { liga: 'arg.2', zonas: { 'Group A': 'A', 'Group B': 'B' } },
  bmetro: { liga: 'arg.3', zonas: null }, // tabla única
};

const stat = (e, nombre) => Number(e.stats.find((s) => s.name === nombre)?.value ?? 0);

export function convertir(json, fuente) {
  const grupos = json.children || [];
  const zonas = {};
  grupos.forEach((g, i) => {
    const id = fuente.zonas ? fuente.zonas[g.name] ?? String.fromCharCode(65 + i) : 'U';
    zonas[id] = (g.standings?.entries || []).map((e) => ({
      id: `espn-${e.team.id}`,
      nombre: e.team.displayName,
      rank: stat(e, 'rank'),
      pj: stat(e, 'gamesPlayed'),
      pg: stat(e, 'wins'),
      pe: stat(e, 'ties'),
      pp: stat(e, 'losses'),
      gf: stat(e, 'pointsFor'),
      gc: stat(e, 'pointsAgainst'),
      dg: stat(e, 'pointDifferential'),
      pts: stat(e, 'points'),
    })).sort((a, b) => a.rank - b.rank);
  });
  return { temporada: grupos[0]?.standings?.season ?? null, zonas };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const torneo = String(req.query?.torneo || '');
  const fuente = FUENTES[torneo];
  if (!fuente) return res.status(400).json({ error: `Torneo desconocido. Usá: ${Object.keys(FUENTES).join(', ')}` });
  try {
    const r = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${fuente.liga}/standings`, {
      headers: { 'User-Agent': 'Latabla/0.1 (proyecto personal)' },
    });
    if (!r.ok) throw new Error(`ESPN respondió ${r.status}`);
    const datos = convertir(await r.json(), fuente);
    if (!Object.keys(datos.zonas).length) throw new Error('ESPN no devolvió posiciones');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({ torneo, fuente: 'ESPN', actualizado: new Date().toISOString(), ...datos });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(502).json({ error: e.message });
  }
}
