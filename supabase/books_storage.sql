-- Configuration du stockage des PDF MIMOU BOOKISM
-- Le bucket books reste PRIVE afin de ne pas exposer les livres payants.

insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do update set public = false;

-- Autorise les utilisateurs connectés à déposer des PDF dans books.
drop policy if exists "Authenticated users can upload book PDFs" on storage.objects;
create policy "Authenticated users can upload book PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'books'
  and lower(storage.extension(name)) = 'pdf'
);

-- Autorise les utilisateurs connectés à lire les objets du bucket.
-- Les livres payants devront ensuite être protégés par une vérification
-- côté serveur avant de générer leur URL signée.
drop policy if exists "Authenticated users can read book PDFs" on storage.objects;
create policy "Authenticated users can read book PDFs"
on storage.objects
for select
to authenticated
using (bucket_id = 'books');

-- Permet à l'auteur de supprimer ses fichiers si nécessaire.
drop policy if exists "Authenticated users can delete book PDFs" on storage.objects;
create policy "Authenticated users can delete book PDFs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'books');
