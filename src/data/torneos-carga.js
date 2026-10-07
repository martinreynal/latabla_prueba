// Torneos que se pueden alimentar con resultados cargados a mano.
// Cada zona tiene su lista de equipos. Con Supabase, los equipos salen de la tabla "equipos".
import { PRIMERA_EJEMPLO } from './primera-ejemplo.js';
import { NACIONAL_EJEMPLO } from './nacional-ejemplo.js';
import { BMETRO_EJEMPLO } from './tercera-ejemplo.js';
import { PRIMERA_C, PROMOCIONAL } from './abajo-ejemplo.js';

const eq = (lista) => lista.map((e) => ({ id: e.id, nombre: e.nombre }));

export const TORNEOS_CARGA = [
  { id: 'primera', nombre: 'Primera División · Clausura 2026', ruta: '/tablas/primera',
    zonas: [{ id: 'A', nombre: 'Zona A', equipos: eq(PRIMERA_EJEMPLO.zonaA) }, { id: 'B', nombre: 'Zona B', equipos: eq(PRIMERA_EJEMPLO.zonaB) }] },
  { id: 'nacional', nombre: 'Primera Nacional 2026', ruta: '/tablas/segunda',
    zonas: [{ id: 'A', nombre: 'Zona A', equipos: eq(NACIONAL_EJEMPLO.zonaA) }, { id: 'B', nombre: 'Zona B', equipos: eq(NACIONAL_EJEMPLO.zonaB) }] },
  { id: 'bmetro', nombre: 'Primera B 2026', ruta: '/tablas/tercera/primera-b',
    zonas: [{ id: 'U', nombre: 'Tabla general', equipos: eq(BMETRO_EJEMPLO.tabla) }] },
  { id: 'primerac', nombre: 'Primera C 2026', ruta: '/tablas/cuarta/primera-c',
    zonas: [{ id: 'A', nombre: 'Zona A', equipos: eq(PRIMERA_C.A) }, { id: 'B', nombre: 'Zona B', equipos: eq(PRIMERA_C.B) }] },
  { id: 'promocional', nombre: 'Promocional Amateur 2026', ruta: '/tablas/quinta/promocional-amateur',
    zonas: [{ id: 'A', nombre: 'Zona A', equipos: eq(PROMOCIONAL.A) }, { id: 'B', nombre: 'Zona B', equipos: eq(PROMOCIONAL.B) }] },
];

export const torneoPorId = (id) => TORNEOS_CARGA.find((t) => t.id === id);
