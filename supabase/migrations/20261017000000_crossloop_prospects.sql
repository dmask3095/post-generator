-- CrossLoop prospect management workspace. Additive: existing user and content data is untouched.
create table if not exists public.crossloop_prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('Hacker News','Product Hunt','Reddit','Instagram','X','YouTube','LinkedIn','TikTok')),
  name text not null,
  role text not null default '',
  profile_url text not null default '',
  source_url text not null,
  contact_method text not null default '',
  contact_url text not null default '',
  fit_reason text not null,
  audience_relevance text not null default '',
  outreach_subject text not null default '',
  outreach_message text not null default '',
  approval_status text not null default 'draft' check (approval_status in ('draft','in_review','approved','rejected')),
  outreach_status text not null default 'not_sent' check (outreach_status in ('not_sent','sent','replied','follow_up','not_interested','converted')),
  last_contacted_at timestamptz,
  follow_up_at timestamptz,
  converted_at timestamptz,
  affiliate_candidate boolean not null default false,
  affiliate_status text not null default 'not_applicable',
  affiliate_terms_verified boolean not null default false,
  affiliate_terms_source text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crossloop_prospects_user_platform_idx on public.crossloop_prospects(user_id, platform, created_at desc);
create index if not exists crossloop_prospects_follow_up_idx on public.crossloop_prospects(user_id, follow_up_at) where follow_up_at is not null;

alter table public.crossloop_prospects enable row level security;
drop policy if exists "crossloop_prospects_select_own" on public.crossloop_prospects;
create policy "crossloop_prospects_select_own" on public.crossloop_prospects for select to authenticated using (auth.uid() = user_id);
drop policy if exists "crossloop_prospects_insert_own" on public.crossloop_prospects;
create policy "crossloop_prospects_insert_own" on public.crossloop_prospects for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "crossloop_prospects_update_own" on public.crossloop_prospects;
create policy "crossloop_prospects_update_own" on public.crossloop_prospects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "crossloop_prospects_delete_own" on public.crossloop_prospects;
create policy "crossloop_prospects_delete_own" on public.crossloop_prospects for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists set_crossloop_prospects_updated_at on public.crossloop_prospects;
create trigger set_crossloop_prospects_updated_at before update on public.crossloop_prospects
for each row execute function public.set_updated_at();
