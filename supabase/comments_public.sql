-- MIMOU BOOKISM : commentaires publics avec pseudo
-- À exécuter une seule fois dans Supabase > SQL Editor.

alter table public.comments enable row level security;

drop policy if exists "Public can read comments" on public.comments;
create policy "Public can read comments"
on public.comments
for select
to anon, authenticated
using (true);

drop policy if exists "Public can post comments" on public.comments;
create policy "Public can post comments"
on public.comments
for insert
to anon, authenticated
with check (
  char_length(trim(user_email)) between 2 and 30
  and char_length(trim(content)) between 1 and 2000
);
