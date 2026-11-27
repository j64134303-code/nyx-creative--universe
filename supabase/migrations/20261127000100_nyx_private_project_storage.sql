-- NYX private project asset storage
-- Each object path is: <user_id>/<project_id>/<uuid>-<safe-file-name>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nyx-project-assets',
  'nyx-project-assets',
  false,
  20971520,
  array[
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
    'application/zip',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "NYX owners read project assets" on storage.objects;
create policy "NYX owners read project assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'nyx-project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.nyx_projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
  )
);

drop policy if exists "NYX owners upload project assets" on storage.objects;
create policy "NYX owners upload project assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'nyx-project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.nyx_projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
  )
);

drop policy if exists "NYX owners update project assets" on storage.objects;
create policy "NYX owners update project assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'nyx-project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.nyx_projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'nyx-project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.nyx_projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
  )
);

drop policy if exists "NYX owners delete project assets" on storage.objects;
create policy "NYX owners delete project assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'nyx-project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.nyx_projects p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = auth.uid()
  )
);
