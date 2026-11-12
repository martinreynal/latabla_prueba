const app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let config, torneos = [], lineas = [], revision = null;
const estado = { torneo: '', zona: '', fecha: 1 };

async function api(ruta, opciones = {}) {
  const r = await fetch(config.url.replace(/\/$/, '') + ruta, {
    ...opciones,
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok && !datos.filas) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

function pintar(mensaje = '', tipo = '') {
  const t = torneos.find((x) => x.id === estado.torneo);
  app.innerHTML = `
    <label>Torneo
      <select id="torneo">${torneos.map((x) => `<option value="${x.id}" ${x.id === estado.torneo ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>
    </label>
    <div class="fila">
      <label>Zona
        <select id="zona">${(t?.zonas || []).map((z) => `<option value="${z.id}" ${z.id === estado.zona ? 'selected' : ''}>${esc(z.nombre)}</option>`).join('')}</select>
      </label>
      <label>Fecha n.º <input id="fecha" type="number" min="1" max="60" value="${estado.fecha}"></label>
    </div>
    <label>Resultados encontrados (podés corregirlos)
      <textarea id="lineas" rows="7">${esc(lineas.join('\n'))}</textarea>
    </label>
    <button id="revisar">Revisar</button>
    ${revision ? `
      <ul class="lista">${revision.filas.map((f) => f.error
        ? `<li class="mal"><span>${esc(f.linea)}</span><small>${esc(f.error)}</small></li>`
        : `<li class="bien"><span>${esc(f.local.nombre)} ${f.gl}–${f.gv} ${esc(f.visitante.nombre)}</span></li>`).join('')}</ul>
      <button id="cargar" class="primario" ${revision.filas.some((f) => !f.error) ? '' : 'disabled'}>Cargar ${revision.filas.filter((f) => !f.error).length} en Latabla</button>` : ''}
    ${mensaje ? `<p class="aviso ${tipo}">${esc(mensaje)}</p>` : ''}`;

  app.querySelector('#torneo').onchange = (e) => { estado.torneo = e.target.value; estado.zona = torneos.find((x) => x.id === estado.torneo).zonas[0].id; revision = null; guardarEstado(); pintar(); };
  app.querySelector('#zona').onchange = (e) => { estado.zona = e.target.value; revision = null; guardarEstado(); pintar(); };
  app.querySelector('#fecha').onchange = (e) => { estado.fecha = Number(e.target.value) || 1; revision = null; guardarEstado(); };
  app.querySelector('#lineas').oninput = (e) => { lineas = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean); revision = null; };
  app.querySelector('#revisar').onclick = () => enviar(false);
  const b = app.querySelector('#cargar');
  if (b) b.onclick = () => enviar(true);
}

async function enviar(confirmar) {
  try {
    const r = await api('/api/resultados', { method: 'POST', body: JSON.stringify({ ...estado, lineas, confirmar }) });
    revision = r;
    if (confirmar) { pintar(`Listo: se cargaron ${r.guardados} partidos. Las tablas de Latabla ya los muestran.`, 'ok'); return; }
    pintar();
  } catch (e) { pintar(e.message, 'error'); }
}

const guardarEstado = () => chrome.storage.local.set({ ultimo: estado });

async function iniciar() {
  config = (await chrome.storage.local.get(['url', 'token'])) || {};
  if (!config.url || !config.token) {
    app.innerHTML = `<p class="nota">Primero configurá la dirección de tu Latabla y el token de la API.</p><button id="opc" class="primario">Abrir configuración</button>`;
    app.querySelector('#opc').onclick = () => chrome.runtime.openOptionsPage();
    return;
  }
  const { ultimo } = await chrome.storage.local.get('ultimo');
  try {
    torneos = (await api('/api/equipos')).torneos;
  } catch (e) {
    app.innerHTML = `<p class="aviso error">No pude conectar con Latabla: ${esc(e.message)}</p>`;
    return;
  }
  Object.assign(estado, { torneo: torneos[0].id, zona: torneos[0].zonas[0].id }, ultimo || {});
  if (!torneos.some((t) => t.id === estado.torneo)) Object.assign(estado, { torneo: torneos[0].id, zona: torneos[0].zonas[0].id });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: latablaExtraer });
    lineas = result.lineas;
    pintar(lineas.length
      ? `Encontré ${lineas.length} ${lineas.length === 1 ? 'resultado' : 'resultados'}${result.origen === 'seleccion' ? ' en el texto que seleccionaste' : ''}. Revisalos antes de cargar.`
      : 'No encontré resultados en esta página. Seleccioná el texto con los partidos y volvé a abrir la extensión, o pegalos acá.');
  } catch {
    lineas = [];
    pintar('No puedo leer esta página (por ejemplo, las páginas internas de Chrome). Podés pegar los resultados a mano.');
  }
}
iniciar();
