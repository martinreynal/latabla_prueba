// Escudos en public/escudos/<id>.png, listados en src/data/escudos.json (lo genera scripts/bajar-escudos.mjs).
import ESCUDOS from '../data/escudos.json';

const PREVIEW = import.meta.env.MODE === 'artifact'; // la vista previa de un solo archivo no lleva imágenes
export const urlEscudo = (id) => (!PREVIEW && ESCUDOS[id] ? `/escudos/${ESCUDOS[id]}` : null);
export function escudoMini(id) {
  const u = urlEscudo(id);
  return u ? `<img class="escudo-mini" src="${u}" alt="" width="18" height="18" loading="lazy" decoding="async">` : '';
}
