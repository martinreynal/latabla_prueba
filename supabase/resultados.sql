-- Resultados cargados a mano. Ejecutalo en Supabase > SQL Editor después de esquema.sql.

create table if not exists partidos (
  id uuid primary key default gen_random_uuid(),
  torneo text not null,          -- primera, nacional, bmetro, primerac, promocional
  zona text not null,            -- A, B o U (tabla única)
  fecha int not null check (fecha > 0),
  local_id text not null,
  visitante_id text not null,
  goles_local int not null check (goles_local >= 0),
  goles_visitante int not null check (goles_visitante >= 0),
  creado_por uuid default auth.uid() references auth.users,
  creado_en timestamptz default now(),
  unique (torneo, zona, fecha, local_id, visitante_id),
  check (local_id <> visitante_id)
);

-- Quiénes pueden cargar. Agregá tu usuario después de entrar una vez al panel:
--   insert into admins (user_id) select id from auth.users where email = 'TU-EMAIL';
create table if not exists admins (
  user_id uuid primary key references auth.users on delete cascade
);

alter table partidos enable row level security;
alter table admins enable row level security;

create policy "resultados públicos" on partidos for select using (true);
create policy "admins cargan" on partidos for insert
  with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "admins corrigen" on partidos for update
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "admins borran" on partidos for delete
  using (exists (select 1 from admins where user_id = auth.uid()));
create policy "cada admin se ve" on admins for select using (user_id = auth.uid());
