// Íconos de trazo (24x24). Cada valor es el atributo "d" de un <path>.
export const ICONS = {
  menu: 'M4 7h16M4 12h16M4 17h10',
  tabla: 'M3 5h18v14H3zM3 9.7h18M3 14.3h18M8 5v14',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  share: 'M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  pix: 'M4 4h4v4H4zM12 4h4v4h-4zM8 8h4v4H8zM16 8h4v4h-4zM4 12h4v4H4zM12 12h4v4h-4zM8 16h4v4H8zM16 16h4v4h-4z',
  tray: 'M4 20h5v-6h6V8h5M18 6l2 2-2 2',
  grilla: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16',
  mm: 'M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4',
  once: 'M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z',
  pen: 'M2 19h20M4 19V6h16v13M4 10h16M9 6v13M15 6v13',
  quien: 'M4 5h16v11H9l-5 4z',
  mapa: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  prode: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  carrera: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  dt: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8 11h8M8 15h5',
  repre: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  tateti: 'M9 3v18M15 3v18M3 9h18M3 15h18',
  plata: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 1.8 3 2.2 3 1 3 2.3-1.3 2-3 2-3-.8-3-2M12 5.8v1.7M12 16.5v1.7',
  bingo: 'M4 4h16v16H4zM8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  guante: 'M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L7 14',
};

export function icon(name, size = 22) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}
