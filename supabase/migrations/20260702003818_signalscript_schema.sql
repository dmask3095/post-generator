
/*
# SignalScript Full Schema Migration

## Summary
Creates the complete SignalScript database schema for an AI Personal Brand Operating System.

## New Tables
1. `profiles` — User profile data synced from auth.users
2. `brand_profiles` — Brand Brain: positioning, audiences, topics, tone, style rules
3. `sources` — Content source configuration (RSS, API, manual, mock)
4. `research_items` — Raw fetched research articles and summaries
5. `trend_clusters` — Grouped trend themes derived from research items
6. `trend_cluster_items` — Join table linking research items to clusters
7. `content_opportunities` — Differentiated content angles from trend clusters
8. `ideas` — User-saved reading notes, quotes, and ideas
9. `content_drafts` — Generated LinkedIn/X post drafts with scores
10. `draft_versions` — Version history for edited drafts
11. `publish_jobs` — Scheduled publishing jobs (manual/automatic)
12. `social_accounts` — OAuth state for LinkedIn and X connections
13. `post_metrics` — Manual or synced engagement metrics per post
14. `learning_reports` — Weekly/monthly AI-generated performance reports
15. `email_preferences` — Per-user email digest settings
16. `app_settings` — Per-user app configuration (mode, posting times, theme)

## Security
- RLS enabled on all tables
- All user-owned tables scoped to `auth.uid() = user_id`
- Sources table allows null user_id for global seed sources
- Separate policies per operation (SELECT/INSERT/UPDATE/DELETE)

## Notes
- Requires pgvector extension for embedding columns (gracefully skipped if unavailable)
- Default sources seeded for Hacker News, Product Hunt, GitHub Trending, OpenAI Blog, YC Blog
- All timestamps in timestamptz for timezone safety
*/

-- Enable required extensions
create extension if not exists pgcrypto;

-- Try to enable vector extension (optional, for embeddings)
do $$ begin
  create extension if not exists vector;
exception when others then
  raise notice 'pgvector extension not available, skipping';
end $$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  email text,
  avatar_url text,
  timezone text default 'America/Los_Angeles',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Brand Brain
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  positioning text[] not null default '{}',
  audiences text[] not null default '{}',
  topics text[] not null default '{}',
  tone_descriptors text[] not null default '{}',
  style_rules jsonb not null default '{}'::jsonb,
  banned_phrases text[] not null default '{}',
  preferred_formats text[] not null default '{}',
  daily_linkedin_target int default 2,
  daily_x_target int default 2,
  include_hashtags boolean default true,
  include_emojis boolean default true,
  require_hook boolean default true,
  require_topic_rationale boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Source configuration
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('rss','api','manual','newsletter','website','social','paper_feed','mock')),
  url text,
  category text,
  is_enabled boolean default true,
  fetch_frequency text default 'daily',
  last_fetched_at timestamptz,
  created_at timestamptz default now()
);

-- Raw research items
create table if not exists public.research_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  url text,
  author text,
  published_at timestamptz,
  raw_summary text,
  content_excerpt text,
  topics text[] default '{}',
  entities text[] default '{}',
  sentiment text,
  importance_score numeric default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Trend clusters
create table if not exists public.trend_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  summary text,
  category text,
  cluster_date date default current_date,
  source_count int default 0,
  momentum_score numeric default 0,
  business_impact_score numeric default 0,
  audience_fit_score numeric default 0,
  novelty_score numeric default 0,
  risk_score numeric default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.trend_cluster_items (
  cluster_id uuid references public.trend_clusters(id) on delete cascade,
  research_item_id uuid references public.research_items(id) on delete cascade,
  primary key (cluster_id, research_item_id)
);

-- Content opportunities
create table if not exists public.content_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cluster_id uuid references public.trend_clusters(id) on delete set null,
  title text not null,
  summary text not null,
  why_it_matters text not null,
  audience_fit text,
  differentiated_angle text,
  angle_type text check (angle_type in ('contrarian','business_implication','product_lesson','founder_lesson','personal_story','trend_breakdown','company_lesson','tool_review','startup_observation','career_lesson','finance_lesson','reading_reflection','other')),
  recommended_formats text[] default '{}',
  originality_score numeric default 0,
  virality_score numeric default 0,
  brand_fit_score numeric default 0,
  clarity_score numeric default 0,
  cliche_risk_score numeric default 0,
  overall_score numeric default 0,
  status text default 'new' check (status in ('new','saved','used','dismissed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ideas and reading notes
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  source_url text,
  source_title text,
  idea_type text default 'note',
  topics text[] default '{}',
  status text default 'active' check (status in ('active','used','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content drafts
create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.content_opportunities(id) on delete set null,
  idea_id uuid references public.ideas(id) on delete set null,
  platform text not null check (platform in ('linkedin','x')),
  post_type text not null,
  title text,
  hook text,
  body text not null,
  hashtags text[] default '{}',
  emojis text[] default '{}',
  rationale text,
  status text default 'draft' check (status in ('draft','needs_review','approved','scheduled','published','rejected','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  external_post_url text,
  brand_fit_score numeric default 0,
  originality_score numeric default 0,
  virality_score numeric default 0,
  clarity_score numeric default 0,
  cliche_risk_score numeric default 0,
  overall_score numeric default 0,
  generation_params jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Draft version history
create table if not exists public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.content_drafts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  version_number int not null,
  body text not null,
  change_instruction text,
  scores jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Publishing jobs
create table if not exists public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid not null references public.content_drafts(id) on delete cascade,
  platform text not null check (platform in ('linkedin','x')),
  mode text not null default 'manual' check (mode in ('manual','semi_automatic','automatic')),
  scheduled_at timestamptz not null,
  status text default 'queued' check (status in ('queued','processing','published','failed','cancelled','manual_ready')),
  error_message text,
  external_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Social accounts and OAuth status
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('linkedin','x')),
  handle text,
  account_name text,
  external_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  is_connected boolean default false,
  connection_status text default 'not_connected',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

-- Metrics
create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid not null references public.content_drafts(id) on delete cascade,
  platform text not null check (platform in ('linkedin','x')),
  metric_date date default current_date,
  impressions int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  reposts int default 0,
  saves int default 0,
  bookmarks int default 0,
  clicks int default 0,
  profile_visits int default 0,
  followers_gained int default 0,
  engagement_rate numeric default 0,
  raw_metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Learning reports
create table if not exists public.learning_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('daily','weekly','monthly')),
  period_start date not null,
  period_end date not null,
  summary text not null,
  what_worked text[] default '{}',
  what_failed text[] default '{}',
  recommendations text[] default '{}',
  learned_patterns jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Email preferences
create table if not exists public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  daily_draft_email_enabled boolean default true,
  daily_email_time time default '08:00',
  weekly_report_enabled boolean default true,
  weekly_report_day int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- App settings
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  publishing_mode text default 'manual' check (publishing_mode in ('manual','semi_automatic','automatic')),
  default_linkedin_times time[] default array['09:00'::time,'17:00'::time],
  default_x_times time[] default array['10:00'::time,'18:00'::time],
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_research_items_user_published on public.research_items(user_id, published_at desc);
create index if not exists idx_trend_clusters_user_date on public.trend_clusters(user_id, cluster_date desc);
create index if not exists idx_opportunities_user_status on public.content_opportunities(user_id, status);
create index if not exists idx_drafts_user_status on public.content_drafts(user_id, status);
create index if not exists idx_drafts_schedule on public.content_drafts(user_id, scheduled_at);
create index if not exists idx_metrics_draft on public.post_metrics(draft_id);
create index if not exists idx_ideas_user_status on public.ideas(user_id, status);

-- RLS
alter table public.profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.sources enable row level security;
alter table public.research_items enable row level security;
alter table public.trend_clusters enable row level security;
alter table public.trend_cluster_items enable row level security;
alter table public.content_opportunities enable row level security;
alter table public.ideas enable row level security;
alter table public.content_drafts enable row level security;
alter table public.draft_versions enable row level security;
alter table public.publish_jobs enable row level security;
alter table public.social_accounts enable row level security;
alter table public.post_metrics enable row level security;
alter table public.learning_reports enable row level security;
alter table public.email_preferences enable row level security;
alter table public.app_settings enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Brand profiles
drop policy if exists "brand_profiles_select_own" on public.brand_profiles;
create policy "brand_profiles_select_own" on public.brand_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "brand_profiles_insert_own" on public.brand_profiles;
create policy "brand_profiles_insert_own" on public.brand_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "brand_profiles_update_own" on public.brand_profiles;
create policy "brand_profiles_update_own" on public.brand_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "brand_profiles_delete_own" on public.brand_profiles;
create policy "brand_profiles_delete_own" on public.brand_profiles for delete to authenticated using (auth.uid() = user_id);

-- Sources (allow null user_id for global defaults)
drop policy if exists "sources_select_own" on public.sources;
create policy "sources_select_own" on public.sources for select to authenticated using (auth.uid() = user_id or user_id is null);
drop policy if exists "sources_insert_own" on public.sources;
create policy "sources_insert_own" on public.sources for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "sources_update_own" on public.sources;
create policy "sources_update_own" on public.sources for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sources_delete_own" on public.sources;
create policy "sources_delete_own" on public.sources for delete to authenticated using (auth.uid() = user_id);

-- Research items
drop policy if exists "research_items_select_own" on public.research_items;
create policy "research_items_select_own" on public.research_items for select to authenticated using (auth.uid() = user_id);
drop policy if exists "research_items_insert_own" on public.research_items;
create policy "research_items_insert_own" on public.research_items for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "research_items_update_own" on public.research_items;
create policy "research_items_update_own" on public.research_items for update to authenticated using (auth.uid() = user_id);
drop policy if exists "research_items_delete_own" on public.research_items;
create policy "research_items_delete_own" on public.research_items for delete to authenticated using (auth.uid() = user_id);

-- Trend clusters
drop policy if exists "trend_clusters_select_own" on public.trend_clusters;
create policy "trend_clusters_select_own" on public.trend_clusters for select to authenticated using (auth.uid() = user_id);
drop policy if exists "trend_clusters_insert_own" on public.trend_clusters;
create policy "trend_clusters_insert_own" on public.trend_clusters for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "trend_clusters_update_own" on public.trend_clusters;
create policy "trend_clusters_update_own" on public.trend_clusters for update to authenticated using (auth.uid() = user_id);
drop policy if exists "trend_clusters_delete_own" on public.trend_clusters;
create policy "trend_clusters_delete_own" on public.trend_clusters for delete to authenticated using (auth.uid() = user_id);

-- Trend cluster items
drop policy if exists "trend_cluster_items_own" on public.trend_cluster_items;
create policy "trend_cluster_items_own" on public.trend_cluster_items for all to authenticated using (
  exists (select 1 from public.trend_clusters c where c.id = trend_cluster_items.cluster_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.trend_clusters c where c.id = trend_cluster_items.cluster_id and c.user_id = auth.uid())
);

-- Opportunities
drop policy if exists "opportunities_select_own" on public.content_opportunities;
create policy "opportunities_select_own" on public.content_opportunities for select to authenticated using (auth.uid() = user_id);
drop policy if exists "opportunities_insert_own" on public.content_opportunities;
create policy "opportunities_insert_own" on public.content_opportunities for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "opportunities_update_own" on public.content_opportunities;
create policy "opportunities_update_own" on public.content_opportunities for update to authenticated using (auth.uid() = user_id);
drop policy if exists "opportunities_delete_own" on public.content_opportunities;
create policy "opportunities_delete_own" on public.content_opportunities for delete to authenticated using (auth.uid() = user_id);

-- Ideas
drop policy if exists "ideas_select_own" on public.ideas;
create policy "ideas_select_own" on public.ideas for select to authenticated using (auth.uid() = user_id);
drop policy if exists "ideas_insert_own" on public.ideas;
create policy "ideas_insert_own" on public.ideas for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ideas_update_own" on public.ideas;
create policy "ideas_update_own" on public.ideas for update to authenticated using (auth.uid() = user_id);
drop policy if exists "ideas_delete_own" on public.ideas;
create policy "ideas_delete_own" on public.ideas for delete to authenticated using (auth.uid() = user_id);

-- Content drafts
drop policy if exists "drafts_select_own" on public.content_drafts;
create policy "drafts_select_own" on public.content_drafts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "drafts_insert_own" on public.content_drafts;
create policy "drafts_insert_own" on public.content_drafts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "drafts_update_own" on public.content_drafts;
create policy "drafts_update_own" on public.content_drafts for update to authenticated using (auth.uid() = user_id);
drop policy if exists "drafts_delete_own" on public.content_drafts;
create policy "drafts_delete_own" on public.content_drafts for delete to authenticated using (auth.uid() = user_id);

-- Draft versions
drop policy if exists "draft_versions_select_own" on public.draft_versions;
create policy "draft_versions_select_own" on public.draft_versions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "draft_versions_insert_own" on public.draft_versions;
create policy "draft_versions_insert_own" on public.draft_versions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "draft_versions_delete_own" on public.draft_versions;
create policy "draft_versions_delete_own" on public.draft_versions for delete to authenticated using (auth.uid() = user_id);

-- Publish jobs
drop policy if exists "publish_jobs_select_own" on public.publish_jobs;
create policy "publish_jobs_select_own" on public.publish_jobs for select to authenticated using (auth.uid() = user_id);
drop policy if exists "publish_jobs_insert_own" on public.publish_jobs;
create policy "publish_jobs_insert_own" on public.publish_jobs for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "publish_jobs_update_own" on public.publish_jobs;
create policy "publish_jobs_update_own" on public.publish_jobs for update to authenticated using (auth.uid() = user_id);
drop policy if exists "publish_jobs_delete_own" on public.publish_jobs;
create policy "publish_jobs_delete_own" on public.publish_jobs for delete to authenticated using (auth.uid() = user_id);

-- Social accounts
drop policy if exists "social_accounts_select_own" on public.social_accounts;
create policy "social_accounts_select_own" on public.social_accounts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "social_accounts_insert_own" on public.social_accounts;
create policy "social_accounts_insert_own" on public.social_accounts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "social_accounts_update_own" on public.social_accounts;
create policy "social_accounts_update_own" on public.social_accounts for update to authenticated using (auth.uid() = user_id);
drop policy if exists "social_accounts_delete_own" on public.social_accounts;
create policy "social_accounts_delete_own" on public.social_accounts for delete to authenticated using (auth.uid() = user_id);

-- Post metrics
drop policy if exists "post_metrics_select_own" on public.post_metrics;
create policy "post_metrics_select_own" on public.post_metrics for select to authenticated using (auth.uid() = user_id);
drop policy if exists "post_metrics_insert_own" on public.post_metrics;
create policy "post_metrics_insert_own" on public.post_metrics for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "post_metrics_update_own" on public.post_metrics;
create policy "post_metrics_update_own" on public.post_metrics for update to authenticated using (auth.uid() = user_id);
drop policy if exists "post_metrics_delete_own" on public.post_metrics;
create policy "post_metrics_delete_own" on public.post_metrics for delete to authenticated using (auth.uid() = user_id);

-- Learning reports
drop policy if exists "learning_reports_select_own" on public.learning_reports;
create policy "learning_reports_select_own" on public.learning_reports for select to authenticated using (auth.uid() = user_id);
drop policy if exists "learning_reports_insert_own" on public.learning_reports;
create policy "learning_reports_insert_own" on public.learning_reports for insert to authenticated with check (auth.uid() = user_id);

-- Email preferences
drop policy if exists "email_prefs_select_own" on public.email_preferences;
create policy "email_prefs_select_own" on public.email_preferences for select to authenticated using (auth.uid() = user_id);
drop policy if exists "email_prefs_insert_own" on public.email_preferences;
create policy "email_prefs_insert_own" on public.email_preferences for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "email_prefs_update_own" on public.email_preferences;
create policy "email_prefs_update_own" on public.email_preferences for update to authenticated using (auth.uid() = user_id);

-- App settings
drop policy if exists "app_settings_select_own" on public.app_settings;
create policy "app_settings_select_own" on public.app_settings for select to authenticated using (auth.uid() = user_id);
drop policy if exists "app_settings_insert_own" on public.app_settings;
create policy "app_settings_insert_own" on public.app_settings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "app_settings_update_own" on public.app_settings;
create policy "app_settings_update_own" on public.app_settings for update to authenticated using (auth.uid() = user_id);

-- Trigger updated_at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_brand_profiles_updated_at on public.brand_profiles;
create trigger set_brand_profiles_updated_at before update on public.brand_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_opportunities_updated_at on public.content_opportunities;
create trigger set_opportunities_updated_at before update on public.content_opportunities for each row execute function public.set_updated_at();
drop trigger if exists set_ideas_updated_at on public.ideas;
create trigger set_ideas_updated_at before update on public.ideas for each row execute function public.set_updated_at();
drop trigger if exists set_drafts_updated_at on public.content_drafts;
create trigger set_drafts_updated_at before update on public.content_drafts for each row execute function public.set_updated_at();
drop trigger if exists set_publish_jobs_updated_at on public.publish_jobs;
create trigger set_publish_jobs_updated_at before update on public.publish_jobs for each row execute function public.set_updated_at();
drop trigger if exists set_social_accounts_updated_at on public.social_accounts;
create trigger set_social_accounts_updated_at before update on public.social_accounts for each row execute function public.set_updated_at();
drop trigger if exists set_metrics_updated_at on public.post_metrics;
create trigger set_metrics_updated_at before update on public.post_metrics for each row execute function public.set_updated_at();
drop trigger if exists set_email_preferences_updated_at on public.email_preferences;
create trigger set_email_preferences_updated_at before update on public.email_preferences for each row execute function public.set_updated_at();
drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed default sources
insert into public.sources (user_id, name, source_type, url, category, is_enabled)
values
  (null, 'Hacker News', 'api', 'https://hacker-news.firebaseio.com/v0/topstories.json', 'technology', true),
  (null, 'Product Hunt', 'api', 'https://api.producthunt.com/v2/api/graphql', 'startups', true),
  (null, 'GitHub Trending', 'website', 'https://github.com/trending', 'technology', true),
  (null, 'OpenAI Blog', 'rss', 'https://openai.com/news/rss.xml', 'ai', true),
  (null, 'Y Combinator Blog', 'rss', 'https://www.ycombinator.com/blog/rss', 'startups', true),
  (null, 'TechCrunch', 'rss', 'https://techcrunch.com/feed/', 'technology', true),
  (null, 'a16z Blog', 'rss', 'https://a16z.com/feed/', 'venture', true)
on conflict do nothing;
