# Latabla

Minijuegos de fútbol argentino en el navegador. Vite + JavaScript, Supabase y deploy en Vercel.

## Verlo en tu computadora

1. Instalá Node.js (versión 18 o más nueva) desde https://nodejs.org
2. Abrí una terminal en esta carpeta y ejecutá:

   ```
   npm install
   npm run dev
   ```

3. Abrí http://localhost:5173 en el navegador. Cada vez que guardes un archivo, la página se actualiza sola.

Para verlo desde el celular en la misma red wifi: `npm run dev -- --host` y abrí la dirección "Network" que aparece en la terminal.

## Conectar Supabase (opcional por ahora)

1. Creá un proyecto en https://supabase.com
2. En SQL Editor, ejecutá `supabase/esquema.sql`
3. Copiá `.env.example` como `.env.local` y completá la URL y la anon key (Project Settings > API)
4. Reiniciá `npm run dev`

El sitio funciona sin Supabase: el progreso del día se guarda en el navegador.

## Publicar en Vercel

1. Subí esta carpeta a un repositorio de GitHub (puede ser privado)
2. En https://vercel.com, "Add New Project" e importá el repo. Vercel detecta Vite solo.
3. En Settings > Environment Variables cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Cada push a una rama genera una URL de preview; lo que subas a `main` va al sitio principal.

## Estructura

```
src/
  main.js              Router y arranque
  styles.css           Estilos y colores
  components/          Header y menú lateral
  pages/               Home, tablas, página de cada juego
  data/juegos.js       Los 9 cuadrantes (nombre, ícono, activo o no)
  data/divisiones.js   Divisiones del menú
  lib/progreso.js      Estado del día de cada juego
  lib/supabase.js      Cliente de Supabase
supabase/esquema.sql   Tablas iniciales
```

## Probar los estados de la home

Entrá a cualquier juego activo y usá los botones de "Modo prueba" para marcarlo como resuelto o fallado. Al volver, el cuadrante cambia de color.

## Cargar resultados

Entrá a `/admin` (también hay un link al pie del menú de Tablas). Elegís torneo, zona y número de fecha, y cargás los partidos de a uno o pegando varios a la vez (`Local 2-1 Visitante`, uno por línea). Las tablas, cruces y ascensos se recalculan solos.

- **Sin Supabase:** los resultados se guardan solo en tu navegador. Usá "Descargar respaldo" para no perderlos.
- **Con Supabase:** ejecutá `supabase/resultados.sql`, entrá al panel con tu email (te llega un link) y después agregate como admin con la línea que está comentada en ese archivo. Solo los admins pueden escribir; todos pueden leer.
