-- NYX authenticated access grants
-- RLS remains enabled; these grants only allow authenticated users to
-- attempt operations that are still restricted by each table's RLS policies.

grant select, insert, update, delete on table
  public.nyx_projects,
  public.nyx_memory_settings,
  public.nyx_core_memory,
  public.nyx_conversations,
  public.nyx_messages,
  public.nyx_studio_tasks,
  public.nyx_project_assets,
  public.nyx_research_sources
to authenticated;
