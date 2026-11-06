-- Hickman Legacy Property Group — investor portal database
-- Run in Supabase SQL Editor. Uses Supabase Auth; never expose service_role keys in the browser.

create extension if not exists pgcrypto;

create table if not exists public.investor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  investment_interest text,
  target_budget text,
  preferred_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  property_address text not null,
  asking_price numeric(14,2),
  details text,
  status text not null default 'submitted' check (status in ('submitted','under_review','approved','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_properties (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_url text not null,
  listing_title text not null,
  asking_price text,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_url)
);

create table if not exists public.investor_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.investor_profiles enable row level security;
alter table public.property_submissions enable row level security;
alter table public.saved_properties enable row level security;
alter table public.investor_inquiries enable row level security;

drop policy if exists "Investors read own profile" on public.investor_profiles;
create policy "Investors read own profile" on public.investor_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Investors create own profile" on public.investor_profiles;
create policy "Investors create own profile" on public.investor_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Investors update own profile" on public.investor_profiles;
create policy "Investors update own profile" on public.investor_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Investors read own submissions" on public.property_submissions;
create policy "Investors read own submissions" on public.property_submissions for select to authenticated using (auth.uid() = submitted_by);
drop policy if exists "Investors create own submissions" on public.property_submissions;
create policy "Investors create own submissions" on public.property_submissions for insert to authenticated with check (auth.uid() = submitted_by);

drop policy if exists "Investors manage own saved properties" on public.saved_properties;
create policy "Investors manage own saved properties" on public.saved_properties for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Investors read own inquiries" on public.investor_inquiries;
create policy "Investors read own inquiries" on public.investor_inquiries for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Investors create own inquiries" on public.investor_inquiries;
create policy "Investors create own inquiries" on public.investor_inquiries for insert to authenticated with check (auth.uid() = user_id);

-- Profile creation is performed by the authenticated portal after sign-up.
-- No public read access, no payment processing, and no investor funds are collected.
