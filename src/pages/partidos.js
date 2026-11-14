// Partidos del día en hora argentina (ESPN vía /api/partidos).
import { urlEscudo } from '../lib/escudos.js';
import { icon } from '../lib/icons.js';

const TZ = 'America/Argentina/Buenos_Aires';
const PREVIEW = import.meta.env.MODE === 'artifact';

// Fecha de hoy en Argentina, como AAAA-MM-DD.
export const hoyAR = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const etiquetaHoy = () => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(new Date());
const mover = (f, dias) => new Date(new Date(`${f}T12:00:00-03:00`).getTime() + dias * 864e5).toISOString().slice(0, 10);
const titulo = (f) => {
  const t = new Intl.DateTimeFormat('es-AR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${f}T12:00:00-03:00`));
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const hora = (iso) => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

let fecha = null;
let timer = 0;

function estado(p) {
  if (p.tipo === 'STATUS_POSTPONED') return ['Postergado', 'susp'];
  if (p.tipo === 'STATUS_CANCELED' || p.tipo === 'STATUS_ABANDONED' || p.tipo === 'STATUS_SUSPENDED') return ['Suspendido', 'susp'];
  if (p.estado === 'in') return [p.tipo === 'STATUS_HALFTIME' ? 'Entretiempo' : (p.reloj || 'En vivo'), 'vivo'];
  if (p.estado === 'post') return [p.local.penales != null ? 'Final · penales' : 'Final', 'fin'];
  return [hora(p.inicio), 'pre'];
}

function escudo(e) {
  const u = (e.id && urlEscudo(e.id)) || e.logo;
  return u ? `<img class="pt__escudo" src="${u}" alt="" width="26" height="26" loading="lazy" decoding="async">` : '<span class="pt__escudo pt__escudo--vacio"></span>';
}

function fila(p) {
  const [txt, cls] = estado(p);
  const jugado = p.estado !== 'pre' && p.local.goles != null;
  const lado = (e, der) => `<span class="pt__eq ${der ? 'pt__eq--der' : 'pt__eq--loc'} ${p.estado === 'post' && e.gana ? 'pt__eq--gana' : ''}">${der ? '' : escudo(e)}<span class="pt__nombre">${e.nombre}</span>${der ? escudo(e) : ''}</span>`;
  const pen = p.local.penales != null ? `<small class="pt__pen">(${p.local.penales}-${p.visitante.penales})</small>` : '';
  return `
    <li class="pt__fila pt__fila--${cls}">
      <span class="pt__estado pt__estado--${cls}">${cls === 'vivo' ? '<i class="pt__punto"></i>' : ''}${txt}</span>
      ${lado(p.local, false)}
      <span class="pt__marcador">${jugado ? `<b>${p.local.goles}</b><span>-</span><b>${p.visitante.goles}</b>${pen}` : '<span class="pt__vs">vs</span>'}</span>
      ${lado(p.visitante, true)}
      <span class="pt__info">${[cls === 'pre' ? null : hora(p.inicio), p.estadio].filter(Boolean).join(' · ')}</span>
    </li>`;
}

function lista(datos) {
  if (!datos.partidos.length) return `<p class="aviso">No hay partidos de las competencias que sigue Latabla para este día.</p>`;
  const grupos = new Map();
  for (const p of datos.partidos) (grupos.get(p.competencia) ?? grupos.set(p.competencia, []).get(p.competencia)).push(p);
  const vivos = datos.partidos.filter((p) => p.estado === 'in').length;
  return `
    <p class="pt__resumen"><strong>${datos.partidos.length}</strong> partidos${vivos ? ` · <span class="pt__vivos"><i class="pt__punto"></i>${vivos} en vivo</span>` : ''} · horarios de Argentina</p>
    ${[...grupos].map(([comp, ps]) => `
      <section class="pt__grupo">
        <h2 class="placa-tabla__titulo">${comp}</h2>
        <ul class="pt__lista">${ps.map(fila).join('')}</ul>
      </section>`).join('')}
    ${datos.consultasFallidas ? '<p class="aviso aviso--chico">Alguna competencia no respondió; puede faltar algún partido.</p>' : ''}`;
}

export function partidos() {
  fecha = fecha ?? hoyAR();
  return {
    titulo: 'Partidos · Latabla',
    html: `
    <section class="tabla-pag pt">
      <div class="tabla-pag__cab">
        <p class="estado-datos" id="pt-estado"><span class="punto-vivo"></span>ESPN · se actualiza cada minuto</p>
        <h1 class="titulo-grande">Partidos</h1>
        <p class="tabla-pag__torneo">Fútbol argentino, copas CONMEBOL y la Selección, en hora argentina.</p>
      </div>
      <div class="pt__dias" role="group" aria-label="Elegir día">
        <button type="button" class="btn-categoria" data-dia="-1" aria-label="Día anterior">${icon('back', 16)}Anterior</button>
        <h2 class="pt__fecha" id="pt-fecha"></h2>
        <button type="button" class="btn-categoria" data-dia="hoy">Hoy</button>
        <button type="button" class="btn-categoria" data-dia="1" aria-label="Día siguiente">Siguiente${icon('chevron', 16)}</button>
      </div>
      <div id="pt-contenido" aria-live="polite"></div>
    </section>`,
    montar() {
      const cont = document.getElementById('pt-contenido');
      async function cargar(silencioso = false) {
        clearTimeout(timer);
        document.getElementById('pt-fecha').textContent = `${titulo(fecha)}${fecha === hoyAR() ? ' · hoy' : ''}`;
        if (PREVIEW) { cont.innerHTML = '<p class="aviso">Los partidos del día se ven en el sitio publicado: la vista previa no se conecta con ESPN.</p>'; return; }
        if (!silencioso) cont.innerHTML = '<p class="aviso aviso--chico">Cargando partidos…</p>';
        try {
          const r = await fetch(`/api/partidos?fecha=${fecha}`);
          if (!r.ok) throw new Error(r.status);
          const datos = await r.json();
          if (!cont.isConnected) return;
          cont.innerHTML = lista(datos);
          // Mientras hay partidos en juego (o por empezar hoy), se refresca solo cada minuto.
          if (fecha === hoyAR() && datos.partidos.some((p) => p.estado !== 'post')) timer = setTimeout(() => cont.isConnected && cargar(true), 60000);
        } catch {
          if (cont.isConnected) cont.innerHTML = '<p class="aviso">No se pudieron cargar los partidos. Probá de nuevo en un rato.</p>';
        }
      }
      document.querySelectorAll('[data-dia]').forEach((b) => b.addEventListener('click', () => {
        fecha = b.dataset.dia === 'hoy' ? hoyAR() : mover(fecha, Number(b.dataset.dia));
        cargar();
      }));
      cargar();
    },
  };
}
