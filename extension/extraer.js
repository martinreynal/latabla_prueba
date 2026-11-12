// Se ejecuta dentro de la página activa, solo cuando tocás el botón de la extensión.
// Devuelve las líneas que parecen resultados: "Equipo 2 - 1 Equipo".
function latablaExtraer() {
  const PATRON = /^(.{2,40}?)\s+(\d{1,2})\s*[-–:x]\s*(\d{1,2})\s+(.{2,40})$/i;
  const limpiar = (t) => (t || '').replace(/\s+/g, ' ').trim();

  // 1) Si seleccionaste texto, se usa solo eso.
  const sel = limpiar(window.getSelection && String(window.getSelection()));
  if (sel) {
    const lineas = String(window.getSelection()).split('\n').map(limpiar).filter((l) => PATRON.test(l));
    if (lineas.length) return { origen: 'seleccion', lineas };
  }

  // 2) Si no, busca los elementos más chicos cuyo texto completo sea un resultado.
  const candidatos = [];
  for (const el of document.body.querySelectorAll('tr, li, a, div, article, section, span, p')) {
    if (el.closest('script, style, noscript, nav, footer')) continue;
    const texto = limpiar(el.innerText ?? el.textContent);
    if (texto.length < 7 || texto.length > 100 || !PATRON.test(texto)) continue;
    candidatos.push({ el, texto });
  }
  const elegidos = candidatos.filter((c) => !candidatos.some((o) => o !== c && c.el.contains(o.el)));
  const vistos = new Set();
  const lineas = [];
  for (const c of elegidos) if (!vistos.has(c.texto)) { vistos.add(c.texto); lineas.push(c.texto); }
  return { origen: 'pagina', lineas: lineas.slice(0, 60) };
}
