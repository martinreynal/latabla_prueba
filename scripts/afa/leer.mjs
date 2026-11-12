// Lectura de notas de afa.com.ar: título, fecha de publicación y tablas de partidos.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ordm: 'º', ordf: 'ª', deg: '°' };
export const limpiar = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ').trim();

export function leerNota(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const titulo = h1 ? limpiar(h1[1]) : '';
  let cuerpo = html.slice(h1 ? h1.index : 0);
  const fin = cuerpo.search(/>\s*Siguiente\s*</);
  if (fin > 0) cuerpo = cuerpo.slice(0, fin);
  const tablas = [];
  for (const t of cuerpo.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    let cab = null;
    for (const tr of t.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const celdas = (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(limpiar);
      if (!celdas.some(Boolean)) continue;
      if (/fecha\s*\/\s*hora/i.test(celdas[0]) || celdas.includes('Partido')) { cab = celdas; tablas.push({ cab, filas: [] }); continue; }
      if (cab) tablas[tablas.length - 1].filas.push(celdas);
    }
  }
  return { titulo, tablas };
}

const ORD = { primera: 1, segunda: 2, tercera: 3, cuarta: 4, quinta: 5, sexta: 6, septima: 7, octava: 8, novena: 9, decima: 10, ultima: null };
const sinTilde = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function numeroFecha(titulo) {
  const t = sinTilde(titulo);
  if (/interzonal/.test(t)) return 'interzonal';
  const m = t.match(/fecha\s*(\d{1,2})/);
  if (m) return +m[1];
  const o = t.match(/(primera|segunda|tercera|cuarta|quinta|sexta|septima|octava|novena|decima|ultima)\s+(fecha|jornada)/);
  return o ? ORD[o[1]] : null;
}

// Tipo de nota según título y cabecera de la tabla.
export function clasificar(titulo, cab) {
  const t = sinTilde(titulo);
  const c = cab.map((x) => sinTilde(x));
  if (/femen/.test(t)) return null;
  if (c.some((x) => /^(4ta|7ma)$/.test(x))) {
    if (/nacional/.test(t)) return 'juv-nacional';
    if (/primera c/.test(t)) return 'juv-c';
    return 'juv-lpf';
  }
  if (/royecc|proyeccio|reserva/.test(t) && c.includes('resultado')) return 'reserva';
  return null;
}

const CAT_COL = { '4ta': 'cuarta', '5ta': 'quinta', '6ta': 'sexta', '7ma': 'septima', '8va': 'octava', '9na': 'novena', resultado: 'unica' };
export function partidosDeNota(nota) {
  const salida = [];
  const fecha = numeroFecha(nota.titulo);
  for (const { cab, filas } of nota.tablas) {
    const tipo = clasificar(nota.titulo, cab);
    if (!tipo) continue;
    const iPartido = cab.indexOf('Partido');
    const cols = cab.map((x, i) => [CAT_COL[sinTilde(x)], i]).filter(([k]) => k);
    for (const f of filas) {
      const partido = f[iPartido] ?? '';
      const m = partido.match(/^(.+?)\s+-\s+(.+)$/);
      if (!m) continue;
      const dia = (f[0] ?? '').match(/(\d{2})\.(\d{2})\.(\d{4})/);
      for (const [cat, i] of cols) {
        const r = (f[i] ?? '').match(/^(\d+)\s*-\s*(\d+)$/);
        salida.push({
          tipo, cat, fecha, dia: dia ? `${dia[3]}-${dia[2]}-${dia[1]}` : null,
          local: m[1].trim(), visitante: m[2].trim().replace(/\.$/, '').trim(),
          gl: r ? +r[1] : null, gv: r ? +r[2] : null,
          goleadores: cat === 'unica' && f[i + 1] ? f[i + 1] : undefined,
        });
      }
    }
  }
  return salida;
}
