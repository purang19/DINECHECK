-- Public Storage bucket for dish photos attached to evaluations.
-- Evaluators (anon) upload; anyone can read via the public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "menu photos anon upload" on storage.objects;
create policy "menu photos anon upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'menu-photos');

drop policy if exists "menu photos public read" on storage.objects;
create policy "menu photos public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-photos');
