// Resultados cargados a mano y cálculo de tablas.
// Sin Supabase configurado, se guardan en este navegador (vista previa y desarrollo).
// Con Supabase, se leen para todos y solo los administradores pueden escribir.
import { supabase } from './supabase.js';
import { torneoPorId } from '../data/torneos-carga.js';

const CLAVE = 'latabla:partidos';
let cache = [];

export const modo = () => (supabase ? 'supabase' : 'local');

function leerLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; }
}
function escribirLocal() {
  try { localStorage.setItem(CLAVE, JSON.stringify(cache)); return true; } catch { return false; }
}
const desdeFila = (r) => ({ id: r.id, torneo: r.torneo, zona: r.zona, fecha: r.fecha, local: r.local_id, visitante: r.visitante_id, gl: r.goles_local, gv: r.goles_visitante });
const aFila = (p) => ({ torneo: p.torneo, zona: p.zona, fecha: p.fecha, local_id: p.local, visitante_id: p.visitante, goles_local: p.gl, goles_visitante: p.gv });
const nuevoId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `p${Date.now()}${Math.random().toString(36).slice(2)}`);

export async function cargarPartidos() {
  if (supabase) {
    const { data, error } = await supabase.from('partidos').select('*');
    if (!error && data) cache = data.map(desdeFila);
  } else {
    cache = leerLocal();
  }
}

export const partidos = (filtro = {}) => cache.filter((p) => Object.entries(filtro).every(([k, v]) => p[k] === v));

const clave = (p) => `${p.torneo}|${p.zona}|${p.fecha}|${p.local}|${p.visitante}`;

// Valida partidos nuevos contra lo ya cargado. Devuelve un array de errores por índice.
export function validar(nuevos) {
  const errores = [];
  const ocupados = new Map();
  partidos().forEach((p) => {
    [p.local, p.visitante].forEach((id) => ocupados.set(`${p.torneo}|${p.zona}|${p.fecha}|${id}`, clave(p)));
  });
  nuevos.forEach((p, i) => {
    const e = [];
    if (!p.local || !p.visitante) e.push('Falta un equipo');
    if (p.local && p.local === p.visitante) e.push('El mismo equipo en los dos lados');
    if (!Number.isInteger(p.gl) || !Number.isInteger(p.gv) || p.gl < 0 || p.gv < 0) e.push('Goles inválidos');
    if (!Number.isInteger(p.fecha) || p.fecha < 1) e.push('Número de fecha inválido');
    [p.local, p.visitante].forEach((id) => {
      if (!id) return;
      const k = `${p.torneo}|${p.zona}|${p.fecha}|${id}`;
      if (ocupados.has(k) && ocupados.get(k) !== clave(p)) e.push('Un equipo ya tiene otro partido cargado en esta fecha');
      ocupados.set(k, clave(p));
    });
    if (e.length) errores[i] = [...new Set(e)];
  });
  return errores;
}

export async function guardar(nuevos) {
  if (supabase) {
    const { data, error } = await supabase.from('partidos')
      .upsert(nuevos.map(aFila), { onConflict: 'torneo,zona,fecha,local_id,visitante_id' }).select();
    if (error) throw new Error(error.message);
    const ids = new Set(data.map((r) => clave(desdeFila(r))));
    cache = [...cache.filter((p) => !ids.has(clave(p))), ...data.map(desdeFila)];
    return;
  }
  const porClave = new Map(cache.map((p) => [clave(p), p]));
  nuevos.forEach((p) => porClave.set(clave(p), { ...p, id: porClave.get(clave(p))?.id || nuevoId() }));
  cache = [...porClave.values()];
  if (!escribirLocal()) throw new Error('El navegador no permitió guardar.');
}

export async function borrar(id) {
  if (supabase) {
    const { error } = await supabase.from('partidos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
  cache = cache.filter((p) => p.id !== id);
  if (!supabase) escribirLocal();
}

export async function importar(lista) {
  const limpios = lista.filter((p) => p && p.torneo && p.zona && p.local && p.visitante)
    .map((p) => ({ torneo: p.torneo, zona: p.zona, fecha: Number(p.fecha), local: p.local, visitante: p.visitante, gl: Number(p.gl), gv: Number(p.gv) }));
  await guardar(limpios);
  return limpios.length;
}
export const exportar = () => JSON.stringify(cache.map(({ id, ...p }) => p), null, 2);

/* ---------- Tablas a partir de resultados ---------- */
export function calcularTabla(equipos, lista) {
  const t = new Map(equipos.map((e) => [e.id, { id: e.id, nombre: e.nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }]));
  lista.forEach((p) => {
    const L = t.get(p.local), V = t.get(p.visitante);
    if (!L || !V) return;
    L.pj++; V.pj++;
    L.gf += p.gl; L.gc += p.gv; V.gf += p.gv; V.gc += p.gl;
    if (p.gl > p.gv) { L.pg++; V.pp++; L.pts += 3; }
    else if (p.gl < p.gv) { V.pg++; L.pp++; V.pts += 3; }
    else { L.pe++; V.pe++; L.pts++; V.pts++; }
  });
  t.forEach((e) => { e.dg = e.gf - e.gc; });
  return [...t.values()];
}

// Tabla real si hay resultados cargados para esa zona; si no, la de ejemplo.
export function tablaZona(torneoId, zonaId, ejemplo) {
  const lista = partidos({ torneo: torneoId, zona: zonaId });
  if (!lista.length) return { filas: ejemplo, real: false, etiqueta: '<span class="fuente fuente--ej">Ejemplo</span>' };
  const zona = torneoPorId(torneoId).zonas.find((z) => z.id === zonaId);
  const ultima = Math.max(...lista.map((p) => p.fecha));
  return { filas: calcularTabla(zona.equipos, lista), real: true, etiqueta: `<span class="fuente fuente--real">Cargada · fecha ${ultima}</span>` };
}

/* ---------- Interpretar texto pegado ---------- */
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function buscarEquipo(texto, equipos) {
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
