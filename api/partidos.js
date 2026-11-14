// GET /api/partidos?fecha=AAAA-MM-DD
// Partidos del día (en hora argentina) de las ligas y copas que sigue Latabla, desde el scoreboard público de ESPN.
// Caché en Vercel: 1 minuto para hoy (hay partidos en vivo), 1 hora para otros días.
// Ojo: endpoint no oficial ni documentado; puede cambiar sin aviso y no está licenciado para uso comercial.

export const LIGAS = [
  { liga: 'arg.1', nombre: 'Liga Profesional' },
  { liga: 'arg.copa', nombre: 'Copa Argentina' },
  { liga: 'arg.2', nombre: 'Primera Nacional' },
  { liga: 'arg.3', nombre: 'Primera B Metropolitana' },
  { liga: 'arg.4', nombre: 'Primera C' },
  { liga: 'arg.5', nombre: 'Primera D' },
  { liga: 'conmebol.libertadores', nombre: 'Copa Libertadores' },
  { liga: 'conmebol.sudamericana', nombre: 'Copa Sudamericana' },
  { liga: 'conmebol.recopa', nombre: 'Recopa Sudamericana' },
  { liga: 'fifa.friendly', nombre: 'Selección Argentina · Amistoso', soloArgentina: true },
  { liga: 'fifa.worldq.conmebol', nombre: 'Selección Argentina · Eliminatorias', soloArgentina: true },
];

const OFFSET_AR = -3; // Argentina no usa horario de verano
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

export function rangoDia(fecha) {
  const inicio = new Date(`${fecha}T00:00:00-03:00`);
  return [inicio, new Date(inicio.getTime() + 864e5)];
}

function equipo(c) {
  return {
    id: c.team?.id ? `espn-${c.team.id}` : null,
    nombre: c.team?.displayName ?? c.team?.name ?? '¿?',
    corto: c.team?.shortDisplayName ?? c.team?.displayName ?? '¿?',
    logo: c.team?.logo ?? null,
    goles: c.score != null && c.score !== '' ? Number(c.score) : null,
    penales: c.shootoutScore != null ? Number(c.shootoutScore) : null,
    gana: c.winner === true,
  };
}

export function convertir(json, fuente, desde, hasta) {
  return (json.events ?? []).filter((e) => {
    const t = new Date(e.date);
    return t >= desde && t < hasta;
  }).map((e) => {
    const c = e.competitions?.[0] ?? {};
    const comp = c.competitors ?? [];
    const local = comp.find((x) => x.homeAway === 'home') ?? comp[0];
    const visita = comp.find((x) => x.homeAway === 'away') ?? comp[1];
    const st = e.status?.type ?? {};
    return {
      id: e.id,
      inicio: e.date,
      competencia: fuente.nombre,
      liga: fuente.liga,
      fase: c.notes?.[0]?.headline ?? e.season?.slug ?? null,
      estado: st.state ?? 'pre', // pre · in · post
      tipo: st.name ?? null, // STATUS_HALFTIME, STATUS_POSTPONED, STATUS_FINAL_PEN…
      detalle: st.shortDetail ?? st.detail ?? '',
      reloj: e.status?.displayClock ?? null,
      local: equipo(local ?? {}),
      visitante: equipo(visita ?? {}),
      estadio: c.venue?.fullName ?? null,
    };
  }).filter((p) => !fuente.soloArgentina || [p.local.nombre, p.visitante.nombre].includes('Argentina'));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const fecha = String(req.query?.fecha || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return res.status(400).json({ error: 'Usá ?fecha=AAAA-MM-DD' });
  const [desde, hasta] = rangoDia(fecha);
  // ESPN agrupa por su propia fecha: se piden el día y el siguiente y se filtra por la hora argentina.
  const dias = [ymd(desde), ymd(new Date(hasta.getTime() - 1))].filter((d, i, a) => a.indexOf(d) === i);
  const resultados = await Promise.allSettled(LIGAS.flatMap((f) => dias.map(async (d) => {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${f.liga}/scoreboard?dates=${d}`, { headers: { 'User-Agent': 'Latabla/0.1 (proyecto personal)' } });
    if (!r.ok) throw new Error(`${f.liga} ${r.status}`);
    return convertir(await r.json(), f, desde, hasta);
  })));
  const vistos = new Set();
  const partidos = resultados.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const fallidas = resultados.filter((r) => r.status === 'rejected').length;
  const hoy = new Date(Date.now() + OFFSET_AR * 36e5).toISOString().slice(0, 10);
  res.setHeader('Cache-Control', fecha === hoy ? 's-maxage=60, stale-while-revalidate=120' : 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({ fecha, fuente: 'ESPN', actualizado: new Date().toISOString(), consultasFallidas: fallidas, partidos });
}
