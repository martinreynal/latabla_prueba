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

## Extensión de Chrome "Capturar resultados"

Lee los resultados de la página que tenés abierta y los manda a Latabla con tu confirmación. No navega sola: solo actúa cuando tocás su botón.

### 1. Configurar la API en Vercel

En Vercel → Settings → Environment Variables agregá:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | El Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | La clave **service_role / secret** de Supabase. Solo va acá, nunca en el sitio ni en la extensión. |
| `LATABLA_API_TOKEN` | Una contraseña larga inventada por vos (32 caracteres o más). |

Después hacé Redeploy.

### 2. Instalar la extensión

1. Abrí `chrome://extensions` y activá **Modo de desarrollador** (arriba a la derecha).
2. Tocá **Cargar descomprimida** y elegí la carpeta `extension`.
3. Abrí la configuración de la extensión y poné la dirección de tu Latabla y el mismo `LATABLA_API_TOKEN`.

### 3. Usarla

En una página con resultados, tocá el ícono de Latabla. Si la página tiene mucho ruido, seleccioná primero el texto de los partidos. Elegí torneo, zona y fecha, tocá **Revisar** y después **Cargar**.

## Tablas en vivo (ESPN)

`/api/tablas?torneo=primera|nacional|bmetro` lee las posiciones del endpoint público de ESPN, que no pide clave, y las devuelve en el formato de Latabla. Vercel guarda la respuesta 10 minutos, así que ESPN recibe como mucho una consulta cada 10 minutos por torneo.

- Cubre Primera División (Clausura, Zonas A y B), Primera Nacional (Zonas A y B) y Primera B (tabla general).
- Si la API falla, cada tabla usa los resultados cargados a mano y, si no hay, los datos de ejemplo.
- Es un endpoint **no oficial ni documentado**: puede cambiar o dejar de andar sin aviso y no está licenciado para uso comercial. Sirve para un proyecto personal; si Latabla se monetiza, hay que pasar a una API con licencia.
- No requiere configurar nada en Vercel: funciona apenas se publica.
