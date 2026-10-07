import { TORNEOS_CARGA, torneoPorId } from '../data/torneos-carga.js';
import { partidos, validar, guardar, borrar, interpretar, exportar, importar, modo } from '../lib/resultados.js';
import { supabase } from '../lib/supabase.js';
import { icon } from '../lib/icons.js';

let torneo = TORNEOS_CARGA[0].id;
let zona = TORNEOS_CARGA[0].zonas[0].id;
let fecha = 1;
let previa = null;      // resultado de interpretar() del texto pegado
let aviso = null;       // { tipo: 'ok' | 'error', texto }
let confirmarBorrado = null;
let sesion = null;
let verRespaldo = false;
const VISTA_PREVIA = import.meta.env.MODE === 'artifact';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function equipos() {
  return torneoPorId(torneo).zonas.find((z) => z.id === zona).equipos;
}
const nombreDe = (id) => equipos().find((e) => e.id === id)?.nombre ?? id;

function opciones(sel) {
  return `<option value="">Elegí…</option>${equipos().map((e) => `<option value="${e.id}" ${e.id === sel ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}`;
}

function bloqueSesion() {
  if (modo() === 'local') {
    return `<p class="admin__modo"><span class="punto-vivo punto-vivo--apagado"></span>Modo vista previa: los resultados se guardan solo en este navegador. Con Supabase conectado se guardan para todos y piden inicio de sesión.</p>`;
  }
  if (!sesion) {
    return `
    <form class="admin__login" id="form-login">
      <p>Ingresá con tu email de administrador. Te llega un link para entrar.</p>
      <label class="donde__label" for="login-email">Email</label>
      <input id="login-email" type="email" class="donde__select" required autocomplete="email">
      <button type="submit" class="btn-principal">Enviarme el link</button>
    </form>`;
  }
  return `<p class="admin__modo"><span class="punto-vivo"></span>Conectado como <strong>${esc(sesion.user.email)}</strong> · <button type="button" class="link-btn" id="salir">Salir</button></p>`;
}

function render() {
  const t = torneoPorId(torneo);
  const cargados = partidos({ torneo, zona, fecha });
  const fechasConDatos = [...new Set(partidos({ torneo, zona }).map((p) => p.fecha))].sort((a, b) => a - b);
  const puedeEscribir = modo() === 'local' || sesion;

  return `
  <section class="admin">
    <div class="tabla-pag__cab">
      <h1 class="titulo-grande">Carga de resultados</h1>
      <p class="tabla-pag__torneo">Cargás los partidos y Latabla arma las tablas, los cruces y los ascensos.</p>
    </div>
    ${bloqueSesion()}
    ${aviso ? `<p class="admin__aviso admin__aviso--${aviso.tipo}" role="status">${esc(aviso.texto)}</p>` : ''}

    ${puedeEscribir ? `
    <div class="admin__sel">
      <label><span>Torneo</span>
        <select id="sel-torneo" class="donde__select">${TORNEOS_CARGA.map((x) => `<option value="${x.id}" ${x.id === torneo ? 'selected' : ''}>${x.nombre}</option>`).join('')}</select>
      </label>
      <label><span>Zona</span>
        <select id="sel-zona" class="donde__select">${t.zonas.map((z) => `<option value="${z.id}" ${z.id === zona ? 'selected' : ''}>${z.nombre}</option>`).join('')}</select>
      </label>
      <label><span>Fecha n.º</span>
        <input id="sel-fecha" type="number" min="1" max="60" value="${fecha}" class="donde__select">
      </label>
    </div>
    ${fechasConDatos.length ? `<p class="hoy__nota">Fechas con resultados: ${fechasConDatos.map((f) => `<button type="button" class="chip-fecha ${f === fecha ? 'activa' : ''}" data-ir-fecha="${f}">${f}</button>`).join(' ')}</p>` : ''}

    <section class="admin__bloque">
      <h2 class="placa-tabla__titulo">Fecha ${fecha} · ${cargados.length} ${cargados.length === 1 ? 'partido cargado' : 'partidos cargados'}</h2>
      <div class="admin__caja">
        ${cargados.length ? `
          <ul class="admin__lista">
            ${cargados.map((p) => `
              <li>
                <span class="admin__eq">${esc(nombreDe(p.local))}</span>
                <span class="admin__res">${p.gl} – ${p.gv}</span>
                <span class="admin__eq admin__eq--der">${esc(nombreDe(p.visitante))}</span>
                <button type="button" class="icon-btn" data-borrar="${p.id}" aria-label="Borrar ${esc(nombreDe(p.local))} contra ${esc(nombreDe(p.visitante))}">${icon('close', 18)}</button>
              </li>`).join('')}
          </ul>` : '<p class="hoy__nota">Todavía no hay partidos en esta fecha.</p>'}

        <form class="admin__form" id="form-partido">
          <select id="f-local" class="donde__select" aria-label="Local" required>${opciones()}</select>
          <input id="f-gl" type="number" min="0" max="30" class="donde__select admin__gol" aria-label="Goles local" required>
          <span class="admin__guion">–</span>
          <input id="f-gv" type="number" min="0" max="30" class="donde__select admin__gol" aria-label="Goles visitante" required>
          <select id="f-visitante" class="donde__select" aria-label="Visitante" required>${opciones()}</select>
          <button type="submit" class="btn-principal">Agregar</button>
        </form>
      </div>
    </section>

    <section class="admin__bloque">
      <h2 class="placa-tabla__titulo">Pegar resultados</h2>
      <div class="admin__caja">
        <p class="hoy__nota">Un partido por línea, por ejemplo <code>Equipo A1 2-1 Equipo A5</code>. Se cargan en la fecha ${fecha} de ${t.zonas.find((z) => z.id === zona).nombre}.</p>
        <textarea id="pegar" class="admin__texto" rows="6" placeholder="Local 2-1 Visitante">${previa ? esc(previa.texto) : ''}</textarea>
        <button type="button" class="btn-categoria" id="btn-interpretar">Revisar</button>
        ${previa ? `
          <ul class="admin__previa">
            ${previa.filas.map((f, i) => `
              <li class="${f.error || previa.errores[i] ? 'mal' : 'bien'}">
                <span class="admin__linea">${esc(f.linea)}</span>
                ${f.error ? `<span class="admin__err">${esc(f.error)}</span>`
                  : previa.errores[i] ? `<span class="admin__err">${esc(previa.errores[i].join(' · '))}</span>`
                  : `<span class="admin__ok">${esc(f.local.nombre)} ${f.gl}–${f.gv} ${esc(f.visitante.nombre)}</span>`}
              </li>`).join('')}
          </ul>
          <button type="button" class="btn-principal" id="btn-cargar" ${previa.validos.length ? '' : 'disabled'}>Cargar ${previa.validos.length} ${previa.validos.length === 1 ? 'partido' : 'partidos'}</button>
          ${previa.validos.length < previa.filas.length ? `<p class="hoy__nota">Las líneas en rojo no se cargan. Corregilas en el texto y volvé a revisar.</p>` : ''}` : ''}
      </div>
    </section>

    <section class="admin__bloque">
      <h2 class="placa-tabla__titulo">Ver y respaldar</h2>
      <div class="admin__caja admin__acciones">
        <a href="${t.ruta}" data-link class="btn-categoria">Ver la tabla de ${t.nombre}</a>
        <button type="button" class="btn-categoria" id="btn-exportar">Descargar respaldo (JSON)</button>
        <label class="btn-categoria admin__importar">Importar respaldo<input type="file" id="in-importar" accept="application/json,.json" hidden></label>
        ${partidos({ torneo, zona }).length ? (confirmarBorrado === `${torneo}|${zona}`
          ? `<button type="button" class="btn-categoria admin__peligro" id="btn-borrar-todo-si">Sí, borrar todos los resultados de esta zona</button>`
          : `<button type="button" class="btn-categoria" id="btn-borrar-todo">Borrar resultados de esta zona</button>`) : ''}
        ${verRespaldo ? `<textarea class="admin__texto" rows="8" readonly aria-label="Respaldo en JSON">${esc(exportar())}</textarea><p class="hoy__nota">En la vista previa no se pueden descargar archivos: copiá este texto y guardalo en un archivo .json.</p>` : ''}
      </div>
    </section>` : ''}
  </section>`;
}

export function admin() {
  return {
    titulo: 'Carga de resultados · Latabla',
    html: '<div id="admin-raiz"></div>',
    async montar() {
      const raiz = document.getElementById('admin-raiz');
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        sesion = data.session;
      }
      const ejecutar = async (fn, okTexto) => {
        try { await fn(); aviso = okTexto ? { tipo: 'ok', texto: okTexto } : null; }
        catch (e) { aviso = { tipo: 'error', texto: `No se pudo guardar: ${e.message}` }; }
        pintar();
      };
      const pintar = () => {
        raiz.innerHTML = render();
        const $ = (s) => raiz.querySelector(s);

        $('#form-login')?.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const { error } = await supabase.auth.signInWithOtp({ email: $('#login-email').value, options: { emailRedirectTo: location.href } });
          aviso = error ? { tipo: 'error', texto: error.message } : { tipo: 'ok', texto: 'Te mandamos el link. Revisá tu email.' };
          pintar();
        });
        $('#salir')?.addEventListener('click', async () => { await supabase.auth.signOut(); sesion = null; pintar(); });

        $('#sel-torneo')?.addEventListener('change', (ev) => { torneo = ev.target.value; zona = torneoPorId(torneo).zonas[0].id; previa = null; aviso = null; pintar(); });
        $('#sel-zona')?.addEventListener('change', (ev) => { zona = ev.target.value; previa = null; aviso = null; pintar(); });
        $('#sel-fecha')?.addEventListener('change', (ev) => { fecha = Math.max(1, Number(ev.target.value) || 1); previa = null; aviso = null; pintar(); });
        raiz.querySelectorAll('[data-ir-fecha]').forEach((b) => b.addEventListener('click', () => { fecha = Number(b.dataset.irFecha); previa = null; aviso = null; pintar(); }));

        $('#form-partido')?.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const p = { torneo, zona, fecha, local: $('#f-local').value, visitante: $('#f-visitante').value, gl: Number($('#f-gl').value), gv: Number($('#f-gv').value) };
          const err = validar([p])[0];
          if (err) { aviso = { tipo: 'error', texto: err.join(' · ') }; pintar(); return; }
          ejecutar(() => guardar([p]), `Cargado: ${nombreDe(p.local)} ${p.gl}–${p.gv} ${nombreDe(p.visitante)}`).then(() => $('#f-local')?.focus());
        });

        raiz.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', () => ejecutar(() => borrar(b.dataset.borrar), 'Partido borrado.')));

        $('#btn-interpretar')?.addEventListener('click', () => {
          const texto = $('#pegar').value;
          const filas = interpretar(texto, equipos());
          const candidatos = filas.map((f) => (f.error ? null : { torneo, zona, fecha, local: f.local.id, visitante: f.visitante.id, gl: f.gl, gv: f.gv }));
          const errores = validar(candidatos.map((c) => c || { torneo, zona, fecha, local: 'x', visitante: 'y', gl: 0, gv: 0 }));
          filas.forEach((f, i) => { if (f.error) errores[i] = undefined; });
          const validos = candidatos.filter((c, i) => c && !errores[i]);
          previa = { texto, filas, errores, validos };
          aviso = null;
          pintar();
        });
        $('#btn-cargar')?.addEventListener('click', () => {
          const n = previa.validos.length;
          ejecutar(async () => { await guardar(previa.validos); previa = null; }, `Se cargaron ${n} ${n === 1 ? 'partido' : 'partidos'} en la fecha ${fecha}.`);
        });

        $('#btn-exportar')?.addEventListener('click', () => {
          if (VISTA_PREVIA) { verRespaldo = !verRespaldo; pintar(); return; }
          const url = URL.createObjectURL(new Blob([exportar()], { type: 'application/json' }));
          const a = document.createElement('a');
          a.href = url; a.download = `latabla-resultados-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
        $('#in-importar')?.addEventListener('change', async (ev) => {
          const archivo = ev.target.files[0];
          if (!archivo) return;
          try {
            const n = await importar(JSON.parse(await archivo.text()));
            aviso = { tipo: 'ok', texto: `Se importaron ${n} partidos.` };
          } catch (e) { aviso = { tipo: 'error', texto: `No se pudo importar: ${e.message}` }; }
          pintar();
        });
        $('#btn-borrar-todo')?.addEventListener('click', () => { confirmarBorrado = `${torneo}|${zona}`; pintar(); });
        $('#btn-borrar-todo-si')?.addEventListener('click', () => {
          confirmarBorrado = null;
          ejecutar(async () => { for (const p of partidos({ torneo, zona })) await borrar(p.id); }, 'Se borraron los resultados de la zona.');
        });
      };
      pintar();
    },
  };
}
