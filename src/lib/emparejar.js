// Lectura de líneas de resultados y emparejamiento de nombres de equipos.
// Sin dependencias: lo usan el panel, la API del servidor y la extensión.

/* ---------- Interpretar texto pegado ---------- */
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function buscarEquipo(texto, equipos) {
  const n = norm(texto);
  const exacto = equipos.filter((e) => norm(e.nombre) === n);
  if (exacto.length === 1) return { equipo: exacto[0] };
  const contiene = equipos.filter((e) => ` ${norm(e.nombre)} `.includes(` ${n} `));
  if (contiene.length === 1) return { equipo: contiene[0] };
  const tokens = n.split(' ').filter((x) => x.length > 2);
  const puntaje = equipos.map((e) => ({ e, s: tokens.filter((tk) => norm(e.nombre).split(' ').includes(tk)).length }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (puntaje.length && (puntaje.length === 1 || puntaje[0].s > puntaje[1].s)) return { equipo: puntaje[0].e };
  return { equipo: null, dudas: (contiene.length ? contiene : puntaje.map((x) => x.e)).slice(0, 3).map((e) => e.nombre) };
}

// Acepta "Ferro 2-1 Morón", "Ferro 2 x 1 Morón", "Ferro 2 : 1 Morón" o "Ferro 2 - Morón 1".
export function interpretar(texto, equipos) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linea) => {
    let partes = null;
    let m = linea.match(/^(.+?)\s+(\d{1,2})\s*[-–:x]\s*(\d{1,2})\s+(.+)$/i);
    if (m) partes = [m[1], m[2], m[3], m[4]];
    else {
      m = linea.match(/^(.+?)\s+(\d{1,2})\s*[-–]\s*(.+?)\s+(\d{1,2})$/);
      if (m) partes = [m[1], m[2], m[4], m[3]];
    }
    if (!partes) return { linea, error: 'No entendí el formato. Usá: Local 2-1 Visitante' };
    const L = buscarEquipo(partes[0], equipos), V = buscarEquipo(partes[3], equipos);
    const duda = (txt, r) => `No reconocí "${txt.trim()}"${r.dudas?.length ? ` (¿${r.dudas.join(', ')}?)` : ''}`;
    return {
      linea,
      local: L.equipo, visitante: V.equipo, gl: Number(partes[1]), gv: Number(partes[2]),
      error: !L.equipo ? duda(partes[0], L) : !V.equipo ? duda(partes[3], V) : null,
    };
  });
}
