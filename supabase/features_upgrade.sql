-- MIMOU BOOKISM : fonctionnalités avancées
-- À exécuter une seule fois dans Supabase > SQL Editor.

-- 1) Compteur global de lectures
alter table public.books add column if not exists views_count integer not null default 0;

create or replace function public.increment_book_views(book_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  update public.books
  set views_count = coalesce(views_count, 0) + 1
  where id = book_uuid
  returning views_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_book_views(uuid) to anon, authenticated;

-- 2) Notes publiques par étoiles
create table if not exists public.book_ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  pseudo text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists book_ratings_book_id_idx on public.book_ratings(book_id);
alter table public.book_ratings enable row level security;

drop policy if exists "Public can read ratings" on public.book_ratings;
create policy "Public can read ratings" on public.book_ratings
for select to anon, authenticated using (true);

drop policy if exists "Public can rate" on public.book_ratings;
create policy "Public can rate" on public.book_ratings
for insert to anon, authenticated
with check (
  char_length(trim(pseudo)) between 2 and 30
  and rating between 1 and 5
);

-- 3) L'administrateur peut supprimer les commentaires publics.
drop policy if exists "Admin can delete comments" on public.comments;
create policy "Admin can delete comments" on public.comments
for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com');

-- 4) L'administrateur peut supprimer les notes si nécessaire.
drop policy if exists "Admin can delete ratings" on public.book_ratings;
create policy "Admin can delete ratings" on public.book_ratings
for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com');
