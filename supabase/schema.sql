-- =============================================
-- AI Life Copilot — Supabase Database Schema
-- =============================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates all tables, RLS policies, and indexes needed by the app.

-- 1. PROFILES (extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. LIFESTYLE LOGS (daily entries — one per user per day)
create table if not exists public.lifestyle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date default current_date not null,
  sleep_hours numeric(3,1) not null default 7,
  water_intake numeric(3,1) not null default 2,
  steps integer not null default 5000,
  meals_type text not null default 'mixed' check (meals_type in ('healthy', 'fastfood', 'mixed')),
  screen_time numeric(3,1) not null default 6,
  exercise_time integer not null default 30,
  transport_type text not null default 'public' check (transport_type in ('car', 'bike', 'public', 'walk')),
  health_score integer,
  productivity_score integer,
  sustainability_score integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, logged_date)
);

alter table public.lifestyle_logs enable row level security;

create policy "Users can view own logs"
  on public.lifestyle_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.lifestyle_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on public.lifestyle_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.lifestyle_logs for delete
  using (auth.uid() = user_id);

create index idx_lifestyle_logs_user_date
  on public.lifestyle_logs(user_id, logged_date desc);


-- 3. CHAT THREADS
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chat_threads enable row level security;

create policy "Users can view own threads"
  on public.chat_threads for select
  using (auth.uid() = user_id);

create policy "Users can insert own threads"
  on public.chat_threads for insert
  with check (auth.uid() = user_id);

create policy "Users can update own threads"
  on public.chat_threads for update
  using (auth.uid() = user_id);

create policy "Users can delete own threads"
  on public.chat_threads for delete
  using (auth.uid() = user_id);


-- 4. CHAT MESSAGES
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Users can view own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

create index idx_chat_messages_thread
  on public.chat_messages(thread_id, created_at asc);


-- 5. AI SUGGESTIONS (tracked goals from chat)
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  category text default 'general' check (category in ('steps', 'sleep', 'water', 'screen', 'exercise', 'transport', 'meals', 'general')),
  completed boolean default false not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.suggestions enable row level security;

create policy "Users can view own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own suggestions"
  on public.suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete own suggestions"
  on public.suggestions for delete
  using (auth.uid() = user_id);

create index idx_suggestions_user_active
  on public.suggestions(user_id, completed, created_at desc);


-- 6. UPDATED_AT TRIGGER (auto-updates updated_at column)
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.lifestyle_logs
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.chat_threads
  for each row execute function public.update_updated_at();
