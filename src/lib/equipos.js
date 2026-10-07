// Registro de todos los equipos que aparecen en las tablas, para armar su perfil.
// Con Supabase esto pasa a ser una tabla "equipos" con su ficha y su plantel.
import { PRIMERA_EJEMPLO } from '../data/primera-ejemplo.js';
import { NACIONAL_EJEMPLO } from '../data/nacional-ejemplo.js';
import { BMETRO_EJEMPLO, FEDERAL_EJEMPLO, rng } from '../data/tercera-ejemplo.js';
import { PRIMERA_C, PROMOCIONAL, REGIONAL, LIGAS_POR_PROVINCIA, INFERIORES } from '../data/abajo-ejemplo.js';
import { cuadroEjemplo, CATEGORIAS } from '../data/copa-argentina.js';
import { ordenar } from './reglas-federal.js';

let REGISTRO = null;

function registrar(reg, filas, ctx) {
  ordenar(filas).forEach((e, i) => {
    const previo = reg.get(e.id);
    const contexto = { ...ctx, pos: i + 1, pts: e.pts, pj: e.pj, total: filas.length };
    if (previo) previo.contextos.push(contexto);
    else reg.set(e.id, { id: e.id, nombre: e.nombre, contextos: [contexto] });
  });
}

function construir() {
  const reg = new Map();
  registrar(reg, PRIMERA_EJEMPLO.zonaA, { cat: 'Primera División', torneo: 'Liga Profesional · Zona A', ruta: '/tablas/primera' });
  registrar(reg, PRIMERA_EJEMPLO.zonaB, { cat: 'Primera División', torneo: 'Liga Profesional · Zona B', ruta: '/tablas/primera' });
  registrar(reg, NACIONAL_EJEMPLO.zonaA, { cat: 'Segunda División', torneo: 'Primera Nacional · Zona A', ruta: '/tablas/segunda' });
  registrar(reg, NACIONAL_EJEMPLO.zonaB, { cat: 'Segunda División', torneo: 'Primera Nacional · Zona B', ruta: '/tablas/segunda' });
  registrar(reg, BMETRO_EJEMPLO.tabla, { cat: 'Tercera División', torneo: 'Primera B · Tabla general', ruta: '/tablas/tercera/primera-b' });
  [1, 2, 3, 4].forEach((z) => registrar(reg, FEDERAL_EJEMPLO.zonas[z], { cat: 'Tercera División', torneo: `Federal A · Primera Fase, Zona ${z}`, ruta: '/tablas/tercera/federal-a' }));
  registrar(reg, PRIMERA_C.A, { cat: 'Cuarta División', torneo: 'Primera C · Zona A', ruta: '/tablas/cuarta/primera-c' });
  registrar(reg, PRIMERA_C.B, { cat: 'Cuarta División', torneo: 'Primera C · Zona B', ruta: '/tablas/cuarta/primera-c' });
  REGIONAL.regiones.forEach((r) => r.zonas.forEach((z) => registrar(reg, z.tabla, { cat: 'Cuarta División', torneo: `Regional Federal Amateur · ${r.nombre}, ${z.nombre}`, ruta: '/tablas/cuarta/regional-amateur' })));
  registrar(reg, PROMOCIONAL.A, { cat: 'Quinta División', torneo: 'Promocional Amateur · Zona A', ruta: '/tablas/quinta/promocional-amateur' });
  registrar(reg, PROMOCIONAL.B, { cat: 'Quinta División', torneo: 'Promocional Amateur · Zona B', ruta: '/tablas/quinta/promocional-amateur' });
  Object.entries(LIGAS_POR_PROVINCIA).forEach(([prov, ligas]) => ligas.forEach((l) => registrar(reg, l.tabla, { cat: 'Quinta División', torneo: `${l.nombre} (${prov})`, ruta: '/tablas/quinta/ligas-regionales' })));
  const nombres = { cuarta: 'Cuarta', quinta: 'Quinta', sexta: 'Sexta', septima: 'Séptima', octava: 'Octava', novena: 'Novena' };
  Object.keys(nombres).forEach((c) => registrar(reg, INFERIORES[c], { cat: 'Inferiores', torneo: `${nombres[c]} división`, ruta: `/tablas/inferiores/${c}`, juvenil: true }));
  registrar(reg, INFERIORES.reserva.map((e) => ({ ...e, id: `J${e.id.slice(2)}` })), { cat: 'Inferiores', torneo: 'Reserva · Proyección', ruta: '/tablas/inferiores/reserva', juvenil: true });
  // Copa Argentina (cuadro de ejemplo)
  const vistos = new Set();
  cuadroEjemplo()[0].partidos.forEach((p) => [p.l, p.v].forEach((e) => {
    if (!e || vistos.has(e.id)) return;
    vistos.add(e.id);
    reg.set(e.id, { id: e.id, nombre: e.nombre, contextos: [{ cat: `Copa Argentina · ${CATEGORIAS[e.cat].t}`, torneo: e.motivo, ruta: '/tablas/copa-argentina' }] });
  }));
  return reg;
}

export function buscarEquipo(id) {
  if (!REGISTRO) REGISTRO = construir();
  const clave = id.startsWith('RS') ? `J${id.slice(2)}` : id;
  return REGISTRO.get(clave) || null;
}

/* ---------- Ficha y plantel de ejemplo, derivados del id ---------- */
const COLORES = [['Azul', '#1F4E9C'], ['Rojo', '#B3261E'], ['Blanco', '#F1EFE8'], ['Verde', '#1E7A46'], ['Negro', '#151515'], ['Amarillo', '#D6B82E'], ['Celeste', '#6FA8DC'], ['Bordó', '#6D1F2A'], ['Naranja', '#D96A1E']];
const NOMBRES = ['Tomás', 'Santiago', 'Lautaro', 'Franco', 'Nicolás', 'Matías', 'Agustín', 'Joaquín', 'Facundo', 'Gonzalo', 'Ezequiel', 'Julián', 'Bruno', 'Ramiro', 'Valentín', 'Lucas', 'Thiago', 'Mateo', 'Ignacio', 'Maximiliano', 'Enzo', 'Leandro', 'Nahuel', 'Iván'];
const APELLIDOS = ['Gómez', 'Fernández', 'Rodríguez', 'Sosa', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Giménez', 'Molina', 'Castro', 'Ortiz', 'Silva', 'Ramírez', 'Ledesma', 'Villalba', 'Ferreyra', 'Quiroga', 'Correa', 'Paz', 'Luna', 'Ríos'];
const POS = [['Arqueros', 3], ['Defensores', 8], ['Mediocampistas', 8], ['Delanteros', 6]];

function semilla(id) { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 2147483647; return h || 1; }

export function fichaEquipo(eq) {
  const r = rng(semilla(eq.id));
  const c1 = COLORES[Math.floor(r() * COLORES.length)];
  let c2 = COLORES[Math.floor(r() * COLORES.length)];
  if (c2[0] === c1[0]) c2 = COLORES[(COLORES.indexOf(c1) + 3) % COLORES.length];
  const juvenil = eq.contextos.every((c) => c.juvenil);
  const edadBase = juvenil ? 15 : 19;
  const pj = eq.contextos[0].pj || 20;
  let dorsal = 1;
  const plantel = POS.map(([pos, n]) => ({
    pos,
    jugadores: Array.from({ length: n }, () => {
      const jugo = Math.floor(r() * (pj + 1));
      const goles = pos === 'Delanteros' ? Math.floor(r() * 9) : pos === 'Mediocampistas' ? Math.floor(r() * 5) : pos === 'Defensores' ? Math.floor(r() * 2) : 0;
      return {
        dorsal: dorsal++,
        nombre: `${NOMBRES[Math.floor(r() * NOMBRES.length)]} ${APELLIDOS[Math.floor(r() * APELLIDOS.length)]}`,
        edad: edadBase + Math.floor(r() * (juvenil ? 5 : 16)),
        pj: jugo,
        goles: jugo ? goles : 0,
        ta: Math.floor(r() * Math.max(1, jugo / 4)),
      };
    }),
  }));
  const forma = Array.from({ length: 5 }, () => ['G', 'E', 'P'][Math.floor(r() * 3)]);
  return {
    colores: [c1, c2],
    fundacion: 1890 + Math.floor(r() * 110),
    estadio: `Estadio ${eq.nombre.replace(/^(Equipo|Club) /, '')}`,
    capacidad: (juvenil ? 1 : 3 + Math.floor(r() * 40)) * 1000,
    ciudad: 'Ciudad de ejemplo',
    dt: `${NOMBRES[Math.floor(r() * NOMBRES.length)]} ${APELLIDOS[Math.floor(r() * APELLIDOS.length)]}`,
    forma,
    plantel,
    juvenil,
  };
}
