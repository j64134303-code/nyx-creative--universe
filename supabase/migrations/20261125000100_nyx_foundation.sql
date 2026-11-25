-- NYX shared foundation
-- Safe to apply to a project that does not yet contain these NYX tables.
-- All creator-owned records are protected by Row Level Security.

create extension if not exists pgcrypto;

create or replace function public.nyx_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.nyx_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled project',
  description text not null default '',
  lead_studio_id text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists nyx_projects_user_updated_idx
  on public.nyx_projects (user_id, updated_at desc);

create unique index if not exists nyx_projects_id_user_unique
  on public.nyx_projects (id, user_id);

create table if not exists public.nyx_memory_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  allow_personal_memory boolean not null default true,
  allow_project_memory boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nyx_shared_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.nyx_projects(id) on delete cascade,
  category text not null default 'general',
  content text not null check (char_length(content) between 3 and 3000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint nyx_memory_project_owner_fk
    foreign key (project_id, user_id)
    references public.nyx_projects(id, user_id)
    on delete cascade
);

create index if not exists nyx_memory_user_updated_idx
  on public.nyx_shared_memory (user_id, updated_at desc);
create index if not exists nyx_memory_project_updated_idx
  on public.nyx_shared_memory (project_id, updated_at desc)
  where project_id is not null;

create table if not exists public.nyx_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.nyx_projects(id) on delete cascade,
  studio_id text not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint nyx_conversation_project_owner_fk
    foreign key (project_id, user_id)
    references public.nyx_projects(id, user_id)
    on delete cascade
);

create index if not exists nyx_conversations_user_updated_idx
  on public.nyx_conversations (user_id, updated_at desc);
create index if not exists nyx_conversations_project_idx
  on public.nyx_conversations (project_id, updated_at asc);

create table if not exists public.nyx_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.nyx_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists nyx_messages_conversation_created_idx
  on public.nyx_messages (conversation_id, created_at asc);
create index if not exists nyx_messages_user_created_idx
  on public.nyx_messages (user_id, created_at desc);

create table if not exists public.nyx_studio_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.nyx_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_task_id uuid references public.nyx_studio_tasks(id) on delete set null,
  studio_id text not null,
  assigned_by_studio_id text,
  task_type text not null default 'studio_contribution',
  title text not null,
  instructions text not null default '',
  status text not null default 'planned'
    check (status in ('planned', 'queued', 'running', 'needs_review', 'completed', 'failed', 'cancelled')),
  sequence_no integer not null default 0,
  depends_on uuid[] not null default '{}'::uuid[],
  input_context jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint nyx_task_project_owner_fk
    foreign key (project_id, user_id)
    references public.nyx_projects(id, user_id)
    on delete cascade
);

create index if not exists nyx_tasks_project_sequence_idx
  on public.nyx_studio_tasks (project_id, sequence_no, created_at);
create index if not exists nyx_tasks_user_status_idx
  on public.nyx_studio_tasks (user_id, status, updated_at desc);

create table if not exists public.nyx_project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.nyx_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_id text,
  asset_type text not null,
  storage_bucket text,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint nyx_asset_project_owner_fk
    foreign key (project_id, user_id)
    references public.nyx_projects(id, user_id)
    on delete cascade
);

create index if not exists nyx_assets_project_created_idx
  on public.nyx_project_assets (project_id, created_at desc);

create table if not exists public.nyx_research_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.nyx_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_id text,
  title text not null,
  url text not null,
  description text not null default '',
  source_type text not null default 'web',
  historical_period text,
  published_at timestamptz,
  accessed_at timestamptz not null default timezone('utc', now()),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'disputed', 'outdated')),
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint nyx_research_project_owner_fk
    foreign key (project_id, user_id)
    references public.nyx_projects(id, user_id)
    on delete cascade
);

create index if not exists nyx_research_project_accessed_idx
  on public.nyx_research_sources (project_id, accessed_at desc);
create unique index if not exists nyx_research_project_url_unique
  on public.nyx_research_sources (project_id, url);

-- Composite uniqueness is required by the owner-preserving foreign keys above.
-- Enable RLS on every user-owned table.
alter table public.nyx_projects enable row level security;
alter table public.nyx_memory_settings enable row level security;
alter table public.nyx_shared_memory enable row level security;
alter table public.nyx_conversations enable row level security;
alter table public.nyx_messages enable row level security;
alter table public.nyx_studio_tasks enable row level security;
alter table public.nyx_project_assets enable row level security;
alter table public.nyx_research_sources enable row level security;

-- Policies are dropped and recreated so this migration can be safely re-applied.
drop policy if exists "NYX users manage their projects" on public.nyx_projects;
create policy "NYX users manage their projects" on public.nyx_projects
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "NYX users manage their memory settings" on public.nyx_memory_settings;
create policy "NYX users manage their memory settings" on public.nyx_memory_settings
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "NYX users manage their memory" on public.nyx_shared_memory;
create policy "NYX users manage their memory" on public.nyx_shared_memory
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.nyx_projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "NYX users manage their conversations" on public.nyx_conversations;
create policy "NYX users manage their conversations" on public.nyx_conversations
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      project_id is null
      or exists (
        select 1 from public.nyx_projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "NYX users manage their messages" on public.nyx_messages;
create policy "NYX users manage their messages" on public.nyx_messages
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.nyx_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "NYX users manage their studio tasks" on public.nyx_studio_tasks;
create policy "NYX users manage their studio tasks" on public.nyx_studio_tasks
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.nyx_projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "NYX users manage their project assets" on public.nyx_project_assets;
create policy "NYX users manage their project assets" on public.nyx_project_assets
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.nyx_projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "NYX users manage their research sources" on public.nyx_research_sources;
create policy "NYX users manage their research sources" on public.nyx_research_sources
  for all to authenticated using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.nyx_projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- Keep updated_at accurate for mutable records.
drop trigger if exists nyx_projects_updated_at on public.nyx_projects;
create trigger nyx_projects_updated_at before update on public.nyx_projects
  for each row execute function public.nyx_set_updated_at();

drop trigger if exists nyx_memory_settings_updated_at on public.nyx_memory_settings;
create trigger nyx_memory_settings_updated_at before update on public.nyx_memory_settings
  for each row execute function public.nyx_set_updated_at();

drop trigger if exists nyx_shared_memory_updated_at on public.nyx_shared_memory;
create trigger nyx_shared_memory_updated_at before update on public.nyx_shared_memory
  for each row execute function public.nyx_set_updated_at();

drop trigger if exists nyx_conversations_updated_at on public.nyx_conversations;
create trigger nyx_conversations_updated_at before update on public.nyx_conversations
  for each row execute function public.nyx_set_updated_at();

drop trigger if exists nyx_studio_tasks_updated_at on public.nyx_studio_tasks;
create trigger nyx_studio_tasks_updated_at before update on public.nyx_studio_tasks
  for each row execute function public.nyx_set_updated_at();

drop trigger if exists nyx_project_assets_updated_at on public.nyx_project_assets;
create trigger nyx_project_assets_updated_at before update on public.nyx_project_assets
  for each row execute function public.nyx_set_updated_at();
