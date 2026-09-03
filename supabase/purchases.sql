create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  transaction_id text not null unique,
  amount integer not null,
  currency text not null default 'XOF',
  payment_method text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_book_id_idx on public.purchases(book_id);

alter table public.purchases enable row level security;

create policy "Users can read their purchases"
on public.purchases
for select
using (auth.uid() = user_id);

create policy "Users can create their own pending purchases"
on public.purchases
for insert
with check (auth.uid() = user_id and status = 'PENDING');

-- Les changements de statut sont faits uniquement côté serveur.
