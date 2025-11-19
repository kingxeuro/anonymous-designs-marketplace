-- 1) Ensure moderation toggle exists and is OFF
create table if not exists app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into app_config(key, value)
values ('moderation', jsonb_build_object('auto_approve', false))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 2) Enable RLS on designs table
alter table designs enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists public_select_approved on designs;
drop policy if exists designer_select_own on designs;
drop policy if exists designer_insert_own on designs;
drop policy if exists admin_select_all on designs;
drop policy if exists admin_or_owner_update on designs;

-- Public can read only APPROVED designs (no login required)
create policy public_select_approved on designs
for select
using (status = 'approved');

-- Designers can see their own designs (pending/rejected included)
create policy designer_select_own on designs
for select
using (designer_id = auth.uid());

-- Designers can insert their own rows
create policy designer_insert_own on designs
for insert
with check (designer_id = auth.uid());

-- Admins (by profile role) can see everything
create policy admin_select_all on designs
for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Admins or owners can update designs
create policy admin_or_owner_update on designs
for update
using (
  designer_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (true);
