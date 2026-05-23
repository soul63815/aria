create table public.saved_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.saved_songs enable row level security;
create policy "own_select" on public.saved_songs for select to authenticated using (auth.uid() = user_id);
create policy "own_insert" on public.saved_songs for insert to authenticated with check (auth.uid() = user_id);
create policy "own_update" on public.saved_songs for update to authenticated using (auth.uid() = user_id);
create policy "own_delete" on public.saved_songs for delete to authenticated using (auth.uid() = user_id);
create index saved_songs_user_idx on public.saved_songs(user_id, created_at desc);