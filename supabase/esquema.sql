-- Esquema inicial de Latabla. Pegalo en Supabase > SQL Editor y ejecutalo.

create table if not exists juegos (
  id serial primary key,
  slug text unique not null,
  nombre text not null,
  activo boolean default false
);

create table if not exists jugadores (
  id serial primary key,
  nombre text not null,
  apodo text,
  posicion text,
  imagen_path text
);

create table if not exists clubes (
  id serial primary key,
  nombre text not null,
  imagen_path text
);

create table if not exists trayectorias (
  jugador_id int references jugadores(id) on delete cascade,
  club_id int references clubes(id) on delete cascade,
  desde int,
  hasta int,
  primary key (jugador_id, club_id, desde)
);

-- Un desafío por juego y por día. "payload" guarda lo que cada juego necesite.
create table if not exists desafios (
  id serial primary key,
  juego_id int references juegos(id) on delete cascade,
  fecha date not null,
  payload jsonb not null,
  unique (juego_id, fecha)
);

-- Seguridad: lectura pública del contenido, sin escritura desde el sitio.
alter table juegos enable row level security;
alter table jugadores enable row level security;
alter table clubes enable row level security;
alter table trayectorias enable row level security;
alter table desafios enable row level security;

create policy "lectura publica" on juegos for select using (true);
create policy "lectura publica" on jugadores for select using (true);
create policy "lectura publica" on clubes for select using (true);
create policy "lectura publica" on trayectorias for select using (true);
-- Los desafíos NO tienen lectura pública: los va a servir una función del servidor
-- para que la respuesta del día no quede visible en el navegador.
