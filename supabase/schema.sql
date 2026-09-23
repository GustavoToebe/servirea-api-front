-- ============================================================
-- PARÓQUIA SÃO JOSÉ OPERÁRIO - COROINHAS E ACÓLITOS
-- Execute este arquivo no Supabase > SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- Tipos
DO $$ BEGIN
  create type public.tipo_voluntario as enum ('COROINHA','ACOLITO','AMBOS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.funcao_escala as enum ('MISSAL','CRUZ','CREDENCIA','VELA','COLETA','SINO','OUTRO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.tipo_escala as enum ('SEMANAL','MENSAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.status_escala as enum ('RASCUNHO','FINALIZADA','CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Cadastro principal
create table if not exists public.voluntarios (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  data_nascimento date,
  tipo public.tipo_voluntario not null default 'COROINHA',
  ativo boolean not null default true,
  foto_path text,
  etapa_catequese text,
  eucaristia_ano text,
  crisma_ano text,
  rua text,
  numero text,
  bairro text,
  telefone text,
  celular text,
  email text,
  horario_estudo text check (horario_estudo is null or horario_estudo in ('MANHA','TARDE','NOITE')),
  observacoes text,
  autoriza_whatsapp boolean not null default false,
  funcoes_habilitadas public.funcao_escala[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_voluntarios_nome on public.voluntarios using gin (to_tsvector('portuguese', nome_completo));
create index if not exists idx_voluntarios_ativo on public.voluntarios(ativo);
create index if not exists idx_voluntarios_tipo on public.voluntarios(tipo);

-- Lista dinâmica de responsáveis
create table if not exists public.responsaveis (
  id uuid primary key default gen_random_uuid(),
  voluntario_id uuid not null references public.voluntarios(id) on delete cascade,
  parentesco text not null,
  nome text not null,
  telefone text,
  celular text,
  email text,
  principal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_responsaveis_voluntario on public.responsaveis(voluntario_id);
create unique index if not exists uq_responsavel_principal_por_voluntario
  on public.responsaveis(voluntario_id)
  where principal = true;

-- Cabeçalho da escala
create table if not exists public.escalas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo public.tipo_escala not null,
  ano integer not null check (ano between 2020 and 2100),
  mes integer not null check (mes between 1 and 12),
  status public.status_escala not null default 'RASCUNHO',
  observacao text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_escalas_ano_mes on public.escalas(ano, mes);
create index if not exists idx_escalas_status on public.escalas(status);

-- Cada missa/celebração dentro da escala
create table if not exists public.escala_eventos (
  id uuid primary key default gen_random_uuid(),
  escala_id uuid not null references public.escalas(id) on delete cascade,
  data date not null,
  horario time not null,
  celebracao text not null default 'Missa',
  created_at timestamptz not null default now()
);

create index if not exists idx_escala_eventos_escala on public.escala_eventos(escala_id);
create index if not exists idx_escala_eventos_data on public.escala_eventos(data, horario);

-- Vagas/funções da missa
create table if not exists public.escala_vagas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.escala_eventos(id) on delete cascade,
  funcao public.funcao_escala not null,
  posicao integer not null default 1 check (posicao > 0),
  voluntario_id uuid references public.voluntarios(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(evento_id, funcao, posicao)
);

create index if not exists idx_escala_vagas_evento on public.escala_vagas(evento_id);
create index if not exists idx_escala_vagas_voluntario on public.escala_vagas(voluntario_id);

-- Evita a mesma pessoa duplicada na mesma missa/evento.
create unique index if not exists uq_voluntario_por_evento
  on public.escala_vagas(evento_id, voluntario_id)
  where voluntario_id is not null;

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_voluntarios_updated_at on public.voluntarios;
create trigger trg_voluntarios_updated_at before update on public.voluntarios
for each row execute function public.set_updated_at();

drop trigger if exists trg_escalas_updated_at on public.escalas;
create trigger trg_escalas_updated_at before update on public.escalas
for each row execute function public.set_updated_at();

-- View usada no GET BY ID do coroinha/acólito.
create or replace view public.vw_voluntario_compromissos
with (security_invoker = true)
as
select
  v.voluntario_id,
  s.id as escala_id,
  s.titulo as escala_titulo,
  s.status::text as escala_status,
  e.data,
  e.horario,
  e.celebracao,
  v.funcao
from public.escala_vagas v
join public.escala_eventos e on e.id = v.evento_id
join public.escalas s on s.id = e.escala_id
where v.voluntario_id is not null;

-- ============================================================
-- RLS: somente usuários autenticados podem ler/escrever.
-- Para uma paróquia com poucos administradores, esta política é
-- simples e segura. Depois é possível evoluir para papéis.
-- ============================================================
alter table public.voluntarios enable row level security;
alter table public.responsaveis enable row level security;
alter table public.escalas enable row level security;
alter table public.escala_eventos enable row level security;
alter table public.escala_vagas enable row level security;

DO $$ BEGIN
  create policy "auth_all_voluntarios" on public.voluntarios for all to authenticated using (true) with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_all_responsaveis" on public.responsaveis for all to authenticated using (true) with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
drop policy if exists "auth_all_escalas" on public.escalas;
DO $$ BEGIN
  create policy "auth_select_escalas" on public.escalas for select to authenticated using (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_insert_escalas" on public.escalas for insert to authenticated with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_update_escalas" on public.escalas for update to authenticated using (true) with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_delete_only_cancelled_escalas" on public.escalas for delete to authenticated using (status = 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_all_escala_eventos" on public.escala_eventos for all to authenticated using (true) with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_all_escala_vagas" on public.escala_vagas for all to authenticated using (true) with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- Storage privado para fotos dos menores.
-- O front gera Signed URLs temporárias; as imagens não ficam públicas.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voluntarios-fotos', 'voluntarios-fotos', false, 5242880, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false, file_size_limit = 5242880;

DO $$ BEGIN
  create policy "auth_read_voluntarios_fotos" on storage.objects for select to authenticated using (bucket_id = 'voluntarios-fotos');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_insert_voluntarios_fotos" on storage.objects for insert to authenticated with check (bucket_id = 'voluntarios-fotos');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_update_voluntarios_fotos" on storage.objects for update to authenticated using (bucket_id = 'voluntarios-fotos') with check (bucket_id = 'voluntarios-fotos');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "auth_delete_voluntarios_fotos" on storage.objects for delete to authenticated using (bucket_id = 'voluntarios-fotos');
EXCEPTION WHEN duplicate_object THEN null; END $$;
