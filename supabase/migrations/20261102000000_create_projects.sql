create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(description) between 10 and 300),
  content text not null default '',
  tags text[] not null default '{}',
  category text not null default 'Web Development',
  image_url text not null default '',
  live_url text not null default '',
  repo_url text not null default '',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_featured_idx on public.projects (status, featured desc, created_at desc);
alter table public.projects enable row level security;

-- Only the server-side service-role client can access project rows. Never expose that key in browser code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images" on storage.objects for select using (bucket_id = 'project-images');
