create table if not exists public.dictionary_entries (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  type text not null default 'Mot difficile',
  definition text not null,
  example text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dictionary_entries_word_idx on public.dictionary_entries(lower(word));
create index if not exists dictionary_entries_type_idx on public.dictionary_entries(type);

alter table public.dictionary_entries enable row level security;

drop policy if exists "Public can read dictionary" on public.dictionary_entries;
create policy "Public can read dictionary"
on public.dictionary_entries
for select to anon, authenticated
using (true);

drop policy if exists "Admin can insert dictionary" on public.dictionary_entries;
create policy "Admin can insert dictionary"
on public.dictionary_entries
for insert to authenticated
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com');

drop policy if exists "Admin can update dictionary" on public.dictionary_entries;
create policy "Admin can update dictionary"
on public.dictionary_entries
for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com');

drop policy if exists "Admin can delete dictionary" on public.dictionary_entries;
create policy "Admin can delete dictionary"
on public.dictionary_entries
for delete to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'juniorlakpo300@gmail.com');
