-- NYX studio conversations: additive, preserves all existing chat and task data.
alter table public.nyx_conversations
  add column if not exists conversation_type text not null default 'conversation',
  add column if not exists context jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'nyx_conversations_type_check'
      and conrelid = 'public.nyx_conversations'::regclass
  ) then
    alter table public.nyx_conversations
      add constraint nyx_conversations_type_check
      check (conversation_type in ('conversation', 'task'));
  end if;
end;
$$;

create index if not exists nyx_conversations_studio_updated_idx
  on public.nyx_conversations (user_id, studio_id, updated_at desc);

-- Message metadata already exists and stores source/provider details.
-- Edits append previous content to metadata.revisions in the application.
