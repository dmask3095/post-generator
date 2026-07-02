-- SignalScript Supabase schema
-- Run in Supabase SQL editor.
-- Enable required extensions.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  email text,
  avatar_url text,
  timezone text default 'America/Los_Angeles',
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
  embedding vector(1536),
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
  embedding vector(1536),
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

-- Helper policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "brand_profiles_all_own" on public.brand_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sources_all_own" on public.sources for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
create policy "research_items_all_own" on public.research_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trend_clusters_all_own" on public.trend_clusters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "opportunities_all_own" on public.content_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ideas_all_own" on public.ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "drafts_all_own" on public.content_drafts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "draft_versions_all_own" on public.draft_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publish_jobs_all_own" on public.publish_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "social_accounts_all_own" on public.social_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "post_metrics_all_own" on public.post_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_reports_all_own" on public.learning_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "email_preferences_all_own" on public.email_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_settings_all_own" on public.app_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- For trend_cluster_items, access is allowed if the cluster belongs to the current user.
create policy "trend_cluster_items_own" on public.trend_cluster_items for all using (
  exists (
    select 1 from public.trend_clusters c
    where c.id = trend_cluster_items.cluster_id
    and c.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.trend_clusters c
    where c.id = trend_cluster_items.cluster_id
    and c.user_id = auth.uid()
  )
);

-- Trigger updated_at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_brand_profiles_updated_at before update on public.brand_profiles for each row execute function public.set_updated_at();
create trigger set_opportunities_updated_at before update on public.content_opportunities for each row execute function public.set_updated_at();
create trigger set_ideas_updated_at before update on public.ideas for each row execute function public.set_updated_at();
create trigger set_drafts_updated_at before update on public.content_drafts for each row execute function public.set_updated_at();
create trigger set_publish_jobs_updated_at before update on public.publish_jobs for each row execute function public.set_updated_at();
create trigger set_social_accounts_updated_at before update on public.social_accounts for each row execute function public.set_updated_at();
create trigger set_metrics_updated_at before update on public.post_metrics for each row execute function public.set_updated_at();
create trigger set_email_preferences_updated_at before update on public.email_preferences for each row execute function public.set_updated_at();
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

-- Seed default sources available to users. User-specific copies can be created after onboarding.
insert into public.sources (user_id, name, source_type, url, category, is_enabled)
values
  (null, 'Hacker News', 'api', 'https://hacker-news.firebaseio.com/v0/topstories.json', 'technology', true),
  (null, 'Product Hunt', 'api', 'https://api.producthunt.com/v2/api/graphql', 'startups', true),
  (null, 'GitHub Trending', 'website', 'https://github.com/trending', 'technology', true),
  (null, 'OpenAI Blog', 'rss', 'https://openai.com/news/rss.xml', 'ai', true),
  (null, 'Y Combinator Blog', 'rss', 'https://www.ycombinator.com/blog/rss', 'startups', true)
on conflict do nothing;
