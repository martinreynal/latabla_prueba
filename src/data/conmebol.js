// Copas CONMEBOL 2026: estado al 14/11/2026, cargado a mano.
// Fuentes: Wikipedia (fases finales de Libertadores y Sudamericana), La Nación, Yahoo Noticias, C5N.

export const CONMEBOL_ACTUALIZADO = '14/11/2026';

// Serie: [equipo 1, equipo 2, global 1, global 2, penales | null, quién pasa (1 o 2), argentino? ]
const s = (a, b, g1, g2, pen, pasa) => ({ a, b, g1, g2, pen, pasa });

export const COPAS_CONMEBOL = {
  libertadores: {
    nombre: 'Copa Libertadores',
    edicion: 'Copa Libertadores 2026',
    resumen: '47 equipos de las diez asociaciones de la CONMEBOL. 32 en fase de grupos, octavos a ida y vuelta y final única.',
    estado: 'Final por jugar',
    final: {
      a: 'Estudiantes de La Plata', b: 'Palmeiras', fecha: 'Sábado 28 de noviembre de 2026',
      lugar: 'Estadio Centenario, Montevideo (Uruguay)', partidoUnico: true, destacado: 'a',
    },
    argentinos: [
      ['Estudiantes de La Plata', 'Campeón del Clausura 2025', 'Finalista', 'final'],
      ['Platense', 'Campeón del Apertura 2025', 'Cuartos de final · eliminado por Fluminense', 'cuartos'],
      ['Independiente Rivadavia', 'Campeón de la Copa Argentina 2025', 'Octavos de final · eliminado por Fluminense (penales)', 'octavos'],
      ['Rosario Central', 'Tabla anual 2025', 'Octavos de final · eliminado por Corinthians', 'octavos'],
      ['Lanús', 'Campeón de la Sudamericana 2025', '3.º en su grupo · pasó a la Sudamericana', 'grupos'],
      ['Boca Juniors', 'Tabla anual 2025', '3.º en su grupo · pasó a la Sudamericana', 'grupos'],
      ['Argentinos Juniors', 'Tabla anual 2025', 'Segunda fase previa · eliminado por Barcelona (penales)', 'previa'],
    ],
    cuadro: [
      { ronda: 'Octavos de final', series: [
        s('Estudiantes', 'Universidad Católica', 4, 1, null, 1),
        s('Mirassol', 'LDU Quito', 1, 1, [4, 5], 2),
        s('Fluminense', 'Independiente Rivadavia', 1, 1, [5, 4], 1),
        s('Deportes Tolima', 'Independiente del Valle', 1, 4, null, 2),
        s('Cruzeiro', 'Flamengo', 2, 3, null, 2),
        s('Platense', 'Coquimbo Unido', 1, 1, [7, 6], 1),
        s('Palmeiras', 'Cerro Porteño', 2, 1, null, 1),
        s('Rosario Central', 'Corinthians', 0, 1, null, 2),
      ] },
      { ronda: 'Cuartos de final', series: [
        s('Estudiantes', 'Corinthians', 2, 1, null, 1),
        s('Palmeiras', 'LDU Quito', 3, 3, [4, 3], 1),
        s('Fluminense', 'Platense', 3, 2, null, 1),
        s('Independiente del Valle', 'Flamengo', 1, 3, null, 2),
      ] },
      { ronda: 'Semifinales', series: [
        s('Estudiantes', 'Flamengo', 0, 0, [3, 2], 1),
        s('Palmeiras', 'Fluminense', 2, 2, [5, 3], 1),
      ] },
    ],
    campeones: [[2025, 'Flamengo'], [2024, 'Botafogo'], [2023, 'Fluminense'], [2022, 'Flamengo'], [2021, 'Palmeiras']],
    titulosArgentinos: '25 títulos argentinos: Independiente 7, Boca 6, Estudiantes 4, River 4, Racing, Argentinos, Vélez y San Lorenzo 1 cada uno.',
  },

  sudamericana: {
    nombre: 'Copa Sudamericana',
    edicion: 'Copa Sudamericana 2026',
    resumen: '56 equipos: 44 clasificados y los 12 terceros de los grupos de la Libertadores. Final única.',
    estado: 'Final por jugar',
    final: {
      a: 'Boca Juniors', b: 'Atlético Mineiro', fecha: 'Sábado 21 de noviembre de 2026 · 19:30 (hora argentina)',
      lugar: 'Estadio Metropolitano Roberto Meléndez, Barranquilla (Colombia)', partidoUnico: true, destacado: 'a',
    },
    argentinos: [
      ['Boca Juniors', 'Llegó desde la Libertadores (3.º de grupo)', 'Finalista', 'final'],
      ['River Plate', 'Tabla anual 2025', 'Octavos de final · eliminado por Santa Fe (penales)', 'octavos'],
      ['Tigre', 'Tabla anual 2025', 'Octavos de final · eliminado por Montevideo City Torque', 'octavos'],
      ['Lanús', 'Llegó desde la Libertadores (3.º de grupo)', 'Play-off · eliminado por Cienciano', 'playoff'],
      ['Racing Club', 'Tabla anual 2025', 'Fase de grupos', 'grupos'],
      ['San Lorenzo', 'Tabla anual 2025', 'Fase de grupos', 'grupos'],
      ['Deportivo Riestra', 'Tabla anual 2025', 'Fase de grupos', 'grupos'],
      ['Barracas Central', 'Tabla anual 2025', 'Fase de grupos', 'grupos'],
    ],
    cuadro: [
      { ronda: 'Octavos de final', series: [
        s('Boca Juniors', 'Recoleta', 7, 1, null, 1),
        s('Red Bull Bragantino', 'Atlético Mineiro', 2, 3, null, 2),
        s('Cienciano', 'Botafogo', 6, 2, null, 1),
        s('Vasco da Gama', 'Olimpia', 4, 1, null, 1),
        s('Santa Fe', 'River Plate', 1, 1, [8, 7], 1),
        s('Tigre', 'Montevideo City Torque', 1, 3, null, 2),
        s('Santos', 'Macará', 2, 1, null, 1),
        s('Bolívar', 'São Paulo', 2, 4, null, 2),
      ] },
      { ronda: 'Cuartos de final', series: [
        s('Boca Juniors', 'São Paulo', 2, 1, null, 1),
        s('Santos', 'Atlético Mineiro', 4, 4, [1, 3], 2),
        s('Cienciano', 'Montevideo City Torque', 2, 3, null, 2),
        s('Santa Fe', 'Vasco da Gama', 0, 2, null, 2),
      ] },
      { ronda: 'Semifinales', series: [
        s('Boca Juniors', 'Vasco da Gama', 3, 2, null, 1),
        s('Atlético Mineiro', 'Montevideo City Torque', 3, 2, null, 1),
      ] },
    ],
    campeones: [[2025, 'Lanús'], [2024, 'Racing Club'], [2023, 'LDU Quito'], [2022, 'Independiente del Valle'], [2021, 'Athletico Paranaense']],
    titulosArgentinos: 'Campeones argentinos: Boca, Independiente y Lanús 2 cada uno; San Lorenzo, Arsenal, River, Defensa y Justicia y Racing 1 cada uno.',
  },

  recopa: {
    nombre: 'Recopa Sudamericana',
    edicion: 'Recopa Sudamericana 2026',
    resumen: 'La juegan el campeón de la Libertadores y el de la Sudamericana del año anterior, a ida y vuelta.',
    estado: 'Terminada · Lanús campeón',
    partidos: [
      { tipo: 'Ida', local: 'Lanús', visitante: 'Flamengo', gl: 1, gv: 0, lugar: 'Estadio Néstor Díaz Pérez, Lanús' },
      { tipo: 'Vuelta', local: 'Flamengo', visitante: 'Lanús', gl: 2, gv: 3, lugar: 'Maracaná, Río de Janeiro', nota: '2-1 en los 90 minutos; Lanús lo ganó en el alargue' },
    ],
    campeon: 'Lanús',
    detalle: 'Lanús, campeón de la Sudamericana 2025, le ganó a Flamengo, campeón de la Libertadores 2025: 4-2 en el global. Goles de la vuelta para Lanús: Rodrigo Castillo, José Canale y Dylan Aquino.',
    campeones: [[2026, 'Lanús'], [2025, 'Racing Club'], [2024, 'Fluminense'], [2023, 'Independiente del Valle'], [2022, 'Athletico Paranaense']],
  },
};
