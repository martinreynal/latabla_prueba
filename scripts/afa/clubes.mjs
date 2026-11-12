// Clubes de la Liga Profesional (Reserva y juveniles) y las formas en que los escribe la AFA.
// Los id son los de ESPN, para enlazar con perfiles y escudos.
const C = [
  [9739, 'Aldosivi', ['ALDOSIVI']],
  [3, 'Argentinos Juniors', ['ARGENTINOS JRS', 'ARGENTINOS JUNIORS']],
  [9747, 'Atlético de Rafaela', ['AT DE RAFAELA', 'ATL DE RAFAELA', 'ATLETICO DE RAFAELA', 'ATLETICO RAFAELA']],
  [9785, 'Atlético Tucumán', ['ATL TUCUMAN', 'ATLETICO TUCUMAN', 'ATLANTA TUCUMANA']],
  [235, 'Banfield', ['BANFIELD']],
  [10060, 'Barracas Central', ['BARRACAS CENTRAL', 'BARRACAS CTRAL']],
  [4, 'Belgrano (Córdoba)', ['BELGRANO (CBA)', 'BELGRANO (CORDOBA)', 'BELGRANO']],
  [5, 'Boca Juniors', ['BOCA JRS', 'BOCA JUNIORS', 'BOCA JORS']],
  [11989, 'Central Córdoba (SdE)', ['CENTRAL CORDOBA (SE)', 'CENTRAL CORDOBA (SGO ESTERO)', 'CTRAL CORDOBA (SE)', 'CTRAL CBA (SGO EST)', 'CENTRO DE CORDOBA (SE)', 'CENTRAL CORDOBA']],
  [7, 'Colón', ['COLON']],
  [8950, 'Defensa y Justicia', ['DEFENSA Y JUSTICIA']],
  [19685, 'Estudiantes (Río Cuarto)', ['ESTUDIANTES (RIO CUARTO)', 'ESTUDIANTES (RC)']],
  [8, 'Estudiantes de La Plata', ['ESTUDIANTES DE LP', 'ESTUDIANTES LP']],
  [9743, 'Ferro Carril Oeste', ['FERRO CO', 'FERRO CARRIL OESTE', 'FERRO']],
  [11972, 'Gimnasia (Mendoza)', ['GIMNASIA Y ESGRIMA (MZA)', 'GIMNASIA (MZA)']],
  [9, 'Gimnasia La Plata', ['GIMNASIA Y ESGRIMA LP', 'GIMNASIA LP', 'GIMNASIA Y ESG LP']],
  [6756, 'Godoy Cruz', ['GODOY CRUZ']],
  [10, 'Huracán', ['HURACAN']],
  [11, 'Independiente', ['INDEPENDIENTE']],
  [9744, 'Independiente Rivadavia', ['INDEPENDIENTE R (MZA)', 'SP INDEPENDIENTE R (MZA)', 'INDEPENDIENTE RIVADAVIA']],
  [2975, 'Instituto', ['INSTITUTO']],
  [12, 'Lanús', ['LANUS']],
  [14, "Newell's Old Boys", ["NEWELL'S", 'NEWELLS']],
  [7764, 'Platense', ['PLATENSE']],
  [2741, 'Quilmes', ['QUILMES']],
  [15, 'Racing Club', ['RACING', 'RACING CLUB']],
  [17702, 'Deportivo Riestra', ['RIESTRA', 'DEPORTIVO RIESTRA']],
  [16, 'River Plate', ['RIVER PLATE', 'RIVER']],
  [17, 'Rosario Central', ['ROSARIO CENTRAL', 'ROSARIO CTRAL']],
  [18, 'San Lorenzo', ['SAN LORENZO']],
  [7845, 'San Martín (San Juan)', ['SAN MARTIN (SAN JUAN)', 'SAN MARTIN (SJ)', 'SAN MARTIN (SJ']],
  [10158, 'Sarmiento (Junín)', ['SARMIENTO']],
  [19, 'Talleres (Córdoba)', ['TALLERES (CBA)', 'TALLERES (CORDOBA)', 'TALLERES (CA)']],
  [7767, 'Tigre', ['TIGRE']],
  [20, 'Unión', ['UNION']],
  [21, 'Vélez Sarsfield', ['VELEZ', 'VELEZ SARSFIELD']],
];

export const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  .replace(/-:-/g, '').replace(/\(AFA\)/g, '').replace(/\./g, '').replace(/\s+/g, ' ').trim();

const MAPA = new Map();
export const CLUBES_LPF = {};
for (const [id, nombre, alias] of C) {
  const club = { id: `espn-${id}`, nombre };
  CLUBES_LPF[club.id] = nombre;
  for (const a of alias) MAPA.set(normalizar(a), club);
}
export const identificar = (nombreAfa) => MAPA.get(normalizar(nombreAfa)) ?? null;
