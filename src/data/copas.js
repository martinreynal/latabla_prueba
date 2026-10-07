// Copas complementarias de AFA. Datos cargados a mano (verificados al 29/09/2026).
// Más adelante vienen de Supabase. Nunca inventar participantes: si no se conocen,
// se muestra el origen de la plaza con nombre: null.

export const COPAS_ACTUALES = [
  {
    id: 'trofeo',
    nombre: 'Trofeo de Campeones',
    edicion: 'Edición 2026',
    estado: { tipo: 'definir', texto: 'Participantes por definir' },
    fecha: null,
    estadio: null,
    fuentes: ['Torneo Apertura', 'Torneo Clausura'],
    explicacion: 'Final a partido único entre el campeón del Apertura y el campeón del Clausura del mismo año.',
    participantes: [
      { nombre: 'Belgrano', motivo: 'Campeón Apertura 2026', camino: ['Torneo Apertura 2026', 'Campeón Apertura 2026'] },
      { nombre: null, motivo: 'Campeón Clausura 2026', camino: ['Torneo Clausura 2026', 'Final: 12 de diciembre, La Plata', 'Campeón Clausura 2026'] },
    ],
    nota: 'El campeón juega la Supercopa Argentina y la Supercopa Internacional.',
  },
  {
    id: 'supercopa-argentina',
    nombre: 'Supercopa Argentina',
    edicion: 'Clasificados por títulos de 2025',
    estado: { tipo: 'proxima', texto: 'Próxima' },
    fecha: 'Miércoles 11 de noviembre de 2026',
    estadio: 'Estadio Julio César Villagra, Córdoba',
    fuentes: ['Trofeo de Campeones', 'Copa Argentina'],
    explicacion: 'El campeón del Trofeo de Campeones contra el campeón de la Copa Argentina. Si un mismo club ganó los dos, su rival es el subcampeón del Trofeo de Campeones.',
    participantes: [
      { nombre: 'Estudiantes (LP)', motivo: 'Campeón Trofeo de Campeones 2025', camino: ['Campeón Clausura 2025', 'Trofeo de Campeones 2025: 2–1 a Platense', 'Campeón Trofeo de Campeones 2025'] },
      { nombre: 'Independiente Rivadavia', motivo: 'Campeón Copa Argentina 2025', camino: ['Copa Argentina 2025', 'Campeón Copa Argentina 2025'] },
    ],
    nota: 'Desde 2027, el campeón clasifica a la Recopa de Campeones.',
  },
  {
    id: 'supercopa-internacional',
    nombre: 'Supercopa Internacional',
    edicion: 'Edición 2025',
    estado: { tipo: 'final', texto: 'Finalizada' },
    fecha: 'Sábado 26 de septiembre de 2026',
    estadio: 'Estadio Único Madre de Ciudades, Santiago del Estero',
    fuentes: ['Tabla Anual (Campeón de Liga)', 'Trofeo de Campeones'],
    explicacion: 'El 1.º de la tabla anual, reconocido como Campeón de Liga, contra el campeón del Trofeo de Campeones.',
    aclaracion: '"Internacional" es parte del nombre de la copa. Nació para jugarse en el exterior; no hace falta haber ganado un torneo internacional para jugarla.',
    resultado: '3–1',
    participantes: [
      { nombre: 'Rosario Central', motivo: '1.º Tabla Anual 2025 · Campeón de Liga', campeon: true, camino: ['Apertura + Clausura 2025 (fase de zonas)', '1.º Tabla Anual 2025', 'Campeón de Liga 2025'] },
      { nombre: 'Estudiantes (LP)', motivo: 'Campeón Trofeo de Campeones 2025', camino: ['Campeón Clausura 2025', 'Trofeo de Campeones 2025: 2–1 a Platense', 'Campeón Trofeo de Campeones 2025'] },
    ],
    siguiente: {
      edicion: 'Edición 2026',
      estado: 'Clasificación en curso',
      participantes: [
        { nombre: null, motivo: '1.º Tabla Anual 2026' },
        { nombre: null, motivo: 'Campeón Trofeo de Campeones 2026' },
      ],
    },
  },
  {
    id: 'recopa',
    nombre: 'Recopa de Campeones',
    edicion: 'Primera edición · 2027',
    estado: { tipo: 'curso', texto: 'Clasificación en curso' },
    fecha: null,
    estadio: 'Sede neutral a designar por AFA',
    triangular: true,
    fuentes: ['Copa Argentina', 'Supercopa Argentina', 'Supercopa Internacional'],
    explicacion: 'Triangular entre tres campeones. Todos contra todos, a un partido, y gana el que más puntos suma.',
    participantes: [
      { nombre: null, motivo: 'Campeón Copa Argentina', sigla: 'CA' },
      { nombre: null, motivo: 'Campeón Supercopa Argentina', sigla: 'SA' },
      { nombre: null, motivo: 'Campeón Supercopa Internacional', sigla: 'SI' },
    ],
    partidos: [
      { n: 1, local: 'Campeón Supercopa Argentina', visitante: 'Campeón Supercopa Internacional' },
      { n: 2, local: 'Campeón Copa Argentina', visitante: 'Perdedor del partido 1' },
      { n: 3, local: 'Campeón Copa Argentina', visitante: 'Ganador del partido 1' },
    ],
    reglas: [
      'Si un partido termina empatado a los 90 minutos, se define por penales.',
      'Desempate en la tabla: diferencia de gol, goles a favor, menos goles recibidos y fair play.',
      'Si un club ganó más de una copa, su plaza pasa al subcampeón de la Supercopa Argentina, después al de la Supercopa Internacional y después al de la Copa Argentina.',
    ],
  },
];

// Historial por año en que se jugó la final. Solo ediciones verificadas.
export const COPAS_HISTORIAL = {
  2026: [
    {
      copa: 'Supercopa Internacional', edicion: 'Edición 2025',
      fecha: '26 de septiembre de 2026', estadio: 'Estadio Único Madre de Ciudades, Santiago del Estero',
      campeon: { nombre: 'Rosario Central', motivo: '1.º Tabla Anual 2025 · Campeón de Liga' },
      subcampeon: { nombre: 'Estudiantes (LP)', motivo: 'Campeón Trofeo de Campeones 2025' },
      resultado: '3–1',
      formato: '1.º de la tabla anual contra el campeón del Trofeo de Campeones.',
    },
  ],
  2025: [
    {
      copa: 'Trofeo de Campeones', edicion: 'Edición 2025',
      fecha: 'Diciembre de 2025', estadio: 'Estadio Único de San Nicolás',
      campeon: { nombre: 'Estudiantes (LP)', motivo: 'Campeón Clausura 2025' },
      subcampeon: { nombre: 'Platense', motivo: 'Campeón Apertura 2025' },
      resultado: '2–1',
      formato: 'Campeón del Apertura contra campeón del Clausura. Primer año con este formato.',
    },
    {
      copa: 'Supercopa Argentina', edicion: 'Edición 2024',
      fecha: '6 de septiembre de 2025', estadio: 'Gigante de Arroyito, Rosario',
      campeon: { nombre: 'Vélez Sarsfield', motivo: 'Campeón Liga Profesional 2024' },
      subcampeon: { nombre: 'Central Córdoba (SdE)', motivo: 'Campeón Copa Argentina 2024' },
      resultado: '2–0',
      formato: 'Campeón de Primera División contra campeón de la Copa Argentina (formato anterior a 2025).',
    },
    {
      copa: 'Supercopa Internacional', edicion: 'Edición 2024',
      fecha: '2025', estadio: 'Estadio Libertadores de América, Avellaneda',
      campeon: { nombre: 'Vélez Sarsfield', motivo: '1.º Tabla Anual 2024' },
      subcampeon: { nombre: 'Estudiantes (LP)', motivo: 'Campeón Trofeo de Campeones 2024' },
      resultado: '2–0',
      formato: '1.º de la tabla general contra el campeón del Trofeo de Campeones.',
    },
    {
      copa: 'Supercopa Internacional', edicion: 'Edición 2023',
      fecha: '5 de marzo de 2025', estadio: 'Estadio General Pablo Rojas, Asunción (Paraguay)',
      campeon: { nombre: 'Talleres (C)', motivo: '2.º Tabla General 2023' },
      subcampeon: { nombre: 'River Plate', motivo: 'Campeón Trofeo de Campeones 2023 y 1.º Tabla General 2023' },
      resultado: '0–0 (3–2 en penales)',
      formato: 'Mejor de la tabla general contra el campeón del Trofeo de Campeones. Como River era las dos cosas, entró el 2.º de la tabla.',
    },
  ],
  2024: [
    {
      copa: 'Trofeo de Campeones', edicion: 'Edición 2024',
      fecha: 'Diciembre de 2024', estadio: 'Estadio Único Madre de Ciudades, Santiago del Estero',
      campeon: { nombre: 'Estudiantes (LP)', motivo: 'Campeón Copa de la Liga 2024' },
      subcampeon: { nombre: 'Vélez Sarsfield', motivo: 'Campeón Liga Profesional 2024' },
      resultado: '3–0',
      formato: 'Campeón de la Liga contra campeón de la Copa de la Liga (formato anterior a 2025).',
    },
  ],
  2023: [
    {
      copa: 'Supercopa Internacional', edicion: 'Edición 2022',
      fecha: '20 de enero de 2023', estadio: 'Estadio Hazza bin Zayed, Al Ain (Emiratos Árabes Unidos)',
      campeon: { nombre: 'Racing Club', motivo: 'Campeón Trofeo de Campeones 2022 y 1.º Tabla General 2022' },
      subcampeon: { nombre: 'Boca Juniors', motivo: '2.º Tabla General 2022' },
      resultado: '2–1',
      formato: 'Mejor de la tabla general contra el campeón del Trofeo de Campeones. Como Racing era las dos cosas, entró el 2.º de la tabla.',
    },
  ],
};
