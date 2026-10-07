// Árbol de navegación de Tablas: la pirámide del fútbol argentino.
export const ESTRUCTURA = [
  { slug: 'primera', nombre: 'Primera División', torneo: 'Liga Profesional', subs: [] },
  { slug: 'segunda', nombre: 'Segunda División', subs: [['', 'Primera Nacional']] },
  { slug: 'tercera', nombre: 'Tercera División', subs: [['primera-b', 'Primera B'], ['federal-a', 'Federal A']] },
  { slug: 'cuarta', nombre: 'Cuarta División', subs: [['primera-c', 'Primera C'], ['regional-amateur', 'Torneo Regional Federal Amateur']] },
  { slug: 'quinta', nombre: 'Quinta División', subs: [['promocional-amateur', 'Torneo Promocional Amateur'], ['ligas-regionales', 'Ligas Regionales']] },
  { slug: 'copa-argentina', nombre: 'Copa Argentina', torneo: 'Cuadro 2026', subs: [] },
  { slug: 'copas', nombre: 'Copas AFA', subs: [['trofeo-de-campeones', 'Trofeo de Campeones'], ['supercopa-argentina', 'Supercopa Argentina'], ['supercopa-internacional', 'Supercopa Internacional'], ['recopa-de-campeones', 'Recopa de Campeones']] },
  { slug: 'inferiores', nombre: 'Inferiores', subs: [['reserva', 'Reserva'], ['cuarta', 'Cuarta'], ['quinta', 'Quinta'], ['sexta', 'Sexta'], ['septima', 'Séptima'], ['octava', 'Octava'], ['novena', 'Novena'], ['general', 'Tabla General de Inferiores'], ['fecha', 'Fecha por club']] },
];

// Navegación interna sin importar main.js (evita dependencias circulares).
export function irA(ruta) {
  document.dispatchEvent(new CustomEvent('latabla:navegar', { detail: ruta }));
}
