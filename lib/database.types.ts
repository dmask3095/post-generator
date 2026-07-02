export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      brand_profiles: {
        Row: {
          id: string;
          user_id: string;
          positioning: string[];
          audiences: string[];
          topics: string[];
          tone_descriptors: string[];
          style_rules: Json;
          banned_phrases: string[];
          preferred_formats: string[];
          daily_linkedin_target: number;
          daily_x_target: number;
          include_hashtags: boolean;
          include_emojis: boolean;
          require_hook: boolean;
          require_topic_rationale: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          positioning?: string[];
          audiences?: string[];
          topics?: string[];
          tone_descriptors?: string[];
          style_rules?: Json;
          banned_phrases?: string[];
          preferred_formats?: string[];
          daily_linkedin_target?: number;
          daily_x_target?: number;
          include_hashtags?: boolean;
          include_emojis?: boolean;
          require_hook?: boolean;
          require_topic_rationale?: boolean;
        };
        Update: {
          user_id?: string;
          positioning?: string[];
          audiences?: string[];
          topics?: string[];
          tone_descriptors?: string[];
          style_rules?: Json;
          banned_phrases?: string[];
          preferred_formats?: string[];
          daily_linkedin_target?: number;
          daily_x_target?: number;
          include_hashtags?: boolean;
          include_emojis?: boolean;
          require_hook?: boolean;
          require_topic_rationale?: boolean;
        };
        Relationships: [];
      };
      content_opportunities: {
        Row: {
          id: string;
          user_id: string;
          cluster_id: string | null;
          title: string;
          summary: string;
          why_it_matters: string;
          audience_fit: string | null;
          differentiated_angle: string | null;
          angle_type: string | null;
          recommended_formats: string[];
          originality_score: number;
          virality_score: number;
          brand_fit_score: number;
          clarity_score: number;
          cliche_risk_score: number;
          overall_score: number;
          status: 'new' | 'saved' | 'used' | 'dismissed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cluster_id?: string | null;
          title: string;
          summary: string;
          why_it_matters: string;
          audience_fit?: string | null;
          differentiated_angle?: string | null;
          angle_type?: string | null;
          recommended_formats?: string[];
          originality_score?: number;
          virality_score?: number;
          brand_fit_score?: number;
          clarity_score?: number;
          cliche_risk_score?: number;
          overall_score?: number;
          status?: 'new' | 'saved' | 'used' | 'dismissed';
        };
        Update: {
          user_id?: string;
          cluster_id?: string | null;
          title?: string;
          summary?: string;
          why_it_matters?: string;
          audience_fit?: string | null;
          differentiated_angle?: string | null;
          angle_type?: string | null;
          recommended_formats?: string[];
          originality_score?: number;
          virality_score?: number;
          brand_fit_score?: number;
          clarity_score?: number;
          cliche_risk_score?: number;
          overall_score?: number;
          status?: 'new' | 'saved' | 'used' | 'dismissed';
        };
        Relationships: [];
      };
      content_drafts: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string | null;
          idea_id: string | null;
          platform: 'linkedin' | 'x';
          post_type: string;
          title: string | null;
          hook: string | null;
          body: string;
          hashtags: string[];
          emojis: string[];
          rationale: string | null;
          status: 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived';
          scheduled_at: string | null;
          published_at: string | null;
          external_post_id: string | null;
          external_post_url: string | null;
          brand_fit_score: number;
          originality_score: number;
          virality_score: number;
          clarity_score: number;
          cliche_risk_score: number;
          overall_score: number;
          generation_params: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          opportunity_id?: string | null;
          idea_id?: string | null;
          platform: 'linkedin' | 'x';
          post_type?: string;
          title?: string | null;
          hook?: string | null;
          body: string;
          hashtags?: string[];
          emojis?: string[];
          rationale?: string | null;
          status?: 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived';
          scheduled_at?: string | null;
          published_at?: string | null;
          external_post_id?: string | null;
          external_post_url?: string | null;
          brand_fit_score?: number;
          originality_score?: number;
          virality_score?: number;
          clarity_score?: number;
          cliche_risk_score?: number;
          overall_score?: number;
          generation_params?: Json;
        };
        Update: {
          user_id?: string;
          opportunity_id?: string | null;
          idea_id?: string | null;
          platform?: 'linkedin' | 'x';
          post_type?: string;
          title?: string | null;
          hook?: string | null;
          body?: string;
          hashtags?: string[];
          emojis?: string[];
          rationale?: string | null;
          status?: 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived';
          scheduled_at?: string | null;
          published_at?: string | null;
          external_post_id?: string | null;
          external_post_url?: string | null;
          brand_fit_score?: number;
          originality_score?: number;
          virality_score?: number;
          clarity_score?: number;
          cliche_risk_score?: number;
          overall_score?: number;
          generation_params?: Json;
        };
        Relationships: [];
      };
      draft_versions: {
        Row: {
          id: string;
          draft_id: string;
          user_id: string;
          version_number: number;
          body: string;
          change_instruction: string | null;
          scores: Json;
          created_at: string;
        };
        Insert: {
          draft_id: string;
          user_id: string;
          version_number: number;
          body: string;
          change_instruction?: string | null;
          scores?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      post_metrics: {
        Row: {
          id: string;
          user_id: string;
          draft_id: string;
          platform: 'linkedin' | 'x';
          metric_date: string;
          impressions: number;
          likes: number;
          comments: number;
          shares: number;
          reposts: number;
          saves: number;
          bookmarks: number;
          clicks: number;
          profile_visits: number;
          followers_gained: number;
          engagement_rate: number;
          raw_metrics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          draft_id: string;
          platform: 'linkedin' | 'x';
          metric_date?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          reposts?: number;
          saves?: number;
          bookmarks?: number;
          clicks?: number;
          profile_visits?: number;
          followers_gained?: number;
          engagement_rate?: number;
          raw_metrics?: Json;
        };
        Update: {
          user_id?: string;
          draft_id?: string;
          platform?: 'linkedin' | 'x';
          metric_date?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          reposts?: number;
          saves?: number;
          bookmarks?: number;
          clicks?: number;
          profile_visits?: number;
          followers_gained?: number;
          engagement_rate?: number;
          raw_metrics?: Json;
        };
        Relationships: [];
      };
      learning_reports: {
        Row: {
          id: string;
          user_id: string;
          report_type: 'daily' | 'weekly' | 'monthly';
          period_start: string;
          period_end: string;
          summary: string;
          what_worked: string[];
          what_failed: string[];
          recommendations: string[];
          learned_patterns: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          report_type: 'daily' | 'weekly' | 'monthly';
          period_start: string;
          period_end: string;
          summary: string;
          what_worked?: string[];
          what_failed?: string[];
          recommendations?: string[];
          learned_patterns?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: 'linkedin' | 'x';
          handle: string | null;
          account_name: string | null;
          external_user_id: string | null;
          is_connected: boolean;
          connection_status: string;
          scopes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          platform: 'linkedin' | 'x';
          handle?: string | null;
          account_name?: string | null;
          external_user_id?: string | null;
          is_connected?: boolean;
          connection_status?: string;
          scopes?: string[];
        };
        Update: {
          user_id?: string;
          platform?: 'linkedin' | 'x';
          handle?: string | null;
          account_name?: string | null;
          external_user_id?: string | null;
          is_connected?: boolean;
          connection_status?: string;
          scopes?: string[];
        };
        Relationships: [];
      };
      email_preferences: {
        Row: {
          id: string;
          user_id: string;
          daily_draft_email_enabled: boolean;
          daily_email_time: string;
          weekly_report_enabled: boolean;
          weekly_report_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          daily_draft_email_enabled?: boolean;
          daily_email_time?: string;
          weekly_report_enabled?: boolean;
          weekly_report_day?: number;
        };
        Update: {
          user_id?: string;
          daily_draft_email_enabled?: boolean;
          daily_email_time?: string;
          weekly_report_enabled?: boolean;
          weekly_report_day?: number;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          publishing_mode: 'manual' | 'semi_automatic' | 'automatic';
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          publishing_mode?: 'manual' | 'semi_automatic' | 'automatic';
          theme?: string;
        };
        Update: {
          user_id?: string;
          publishing_mode?: 'manual' | 'semi_automatic' | 'automatic';
          theme?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          body: string;
          source_url: string | null;
          source_title: string | null;
          idea_type: string;
          topics: string[];
          status: 'active' | 'used' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title?: string | null;
          body: string;
          source_url?: string | null;
          source_title?: string | null;
          idea_type?: string;
          topics?: string[];
          status?: 'active' | 'used' | 'archived';
        };
        Update: {
          user_id?: string;
          title?: string | null;
          body?: string;
          source_url?: string | null;
          source_title?: string | null;
          idea_type?: string;
          topics?: string[];
          status?: 'active' | 'used' | 'archived';
        };
        Relationships: [];
      };
      trend_clusters: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          category: string | null;
          cluster_date: string;
          source_count: number;
          momentum_score: number;
          business_impact_score: number;
          audience_fit_score: number;
          novelty_score: number;
          risk_score: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          summary?: string | null;
          category?: string | null;
          cluster_date?: string;
          source_count?: number;
          momentum_score?: number;
          business_impact_score?: number;
          audience_fit_score?: number;
          novelty_score?: number;
          risk_score?: number;
          metadata?: Json;
        };
        Update: {
          user_id?: string;
          title?: string;
          summary?: string | null;
          category?: string | null;
          cluster_date?: string;
          source_count?: number;
          momentum_score?: number;
          business_impact_score?: number;
          audience_fit_score?: number;
          novelty_score?: number;
          risk_score?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          source_type: string;
          url: string | null;
          category: string | null;
          is_enabled: boolean;
          fetch_frequency: string;
          last_fetched_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          name: string;
          source_type: string;
          url?: string | null;
          category?: string | null;
          is_enabled?: boolean;
          fetch_frequency?: string;
          last_fetched_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          name?: string;
          source_type?: string;
          url?: string | null;
          category?: string | null;
          is_enabled?: boolean;
          fetch_frequency?: string;
          last_fetched_at?: string | null;
        };
        Relationships: [];
      };
      publish_jobs: {
        Row: {
          id: string;
          user_id: string;
          draft_id: string;
          platform: 'linkedin' | 'x';
          mode: 'manual' | 'semi_automatic' | 'automatic';
          scheduled_at: string;
          status: string;
          error_message: string | null;
          external_response: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          draft_id: string;
          platform: 'linkedin' | 'x';
          mode: 'manual' | 'semi_automatic' | 'automatic';
          scheduled_at: string;
          status?: string;
          error_message?: string | null;
          external_response?: Json;
        };
        Update: {
          user_id?: string;
          draft_id?: string;
          platform?: 'linkedin' | 'x';
          mode?: 'manual' | 'semi_automatic' | 'automatic';
          scheduled_at?: string;
          status?: string;
          error_message?: string | null;
          external_response?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type BrandProfile = Database['public']['Tables']['brand_profiles']['Row'];
export type ContentOpportunity = Database['public']['Tables']['content_opportunities']['Row'];
export type ContentDraft = Database['public']['Tables']['content_drafts']['Row'];
export type DraftVersion = Database['public']['Tables']['draft_versions']['Row'];
export type PostMetrics = Database['public']['Tables']['post_metrics']['Row'];
export type LearningReport = Database['public']['Tables']['learning_reports']['Row'];
export type SocialAccount = Database['public']['Tables']['social_accounts']['Row'];
export type EmailPreferences = Database['public']['Tables']['email_preferences']['Row'];
export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type Idea = Database['public']['Tables']['ideas']['Row'];
export type TrendCluster = Database['public']['Tables']['trend_clusters']['Row'];
export type Source = Database['public']['Tables']['sources']['Row'];
export type PublishJob = Database['public']['Tables']['publish_jobs']['Row'];

export type DraftStatus = ContentDraft['status'];
export type Platform = ContentDraft['platform'];

export interface ScoreBadges {
  brand_fit: number;
  originality: number;
  virality: number;
  clarity: number;
  cliche_risk: number;
  overall: number;
}

export type TransformInstruction =
  | 'make_sharper'
  | 'make_more_contrarian'
  | 'make_more_personal'
  | 'make_shorter'
  | 'make_more_witty'
  | 'add_business_lens'
  | 'add_product_lens'
  | 'add_founder_lens'
  | 'add_student_lens'
  | 'remove_cliches'
  | 'turn_into_x_thread'
  | 'turn_into_linkedin_carousel';
