'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { MOCK_OPPORTUNITIES, MOCK_DRAFTS, WEEKLY_LEARNING_REPORT } from '@/lib/mock-data';
import type { ContentOpportunity, ContentDraft, Profile } from '@/lib/database.types';
import { ScoreBand, PlatformBadge, StatusBadge } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Radio, SquarePen as PenSquare, SquareCheck as CheckSquare, TrendingUp, Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, oppsRes, draftsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('content_opportunities').select('*').eq('user_id', user.id).eq('status', 'new').order('overall_score', { ascending: false }).limit(4),
      supabase.from('content_drafts').select('*').eq('user_id', user.id).in('status', ['draft', 'needs_review', 'approved']).order('created_at', { ascending: false }).limit(4),
    ]);

    setProfile(profileRes.data);

    const dbOpps = oppsRes.data ?? [];
    const dbDrafts = draftsRes.data ?? [];

    setOpportunities(dbOpps.length > 0 ? dbOpps : MOCK_OPPORTUNITIES.slice(0, 4).map((o, i) => ({ ...o, id: `mock-${i}`, user_id: user.id, cluster_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
    setDrafts(dbDrafts.length > 0 ? dbDrafts : MOCK_DRAFTS.slice(0, 3).map((d, i) => ({ ...d, id: `mock-draft-${i}`, user_id: user.id, opportunity_id: null, idea_id: null, published_at: null, external_post_id: null, external_post_url: null, scheduled_at: null, generation_params: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
    setLoading(false);
  };

  const name = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{greeting}, {name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what to write today.</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Opportunities', value: opportunities.length, icon: Radio, href: '/intelligence' },
          { label: 'Drafts waiting', value: drafts.filter(d => d.status === 'needs_review').length, icon: CheckSquare, href: '/queue' },
          { label: 'Approved', value: drafts.filter(d => d.status === 'approved').length, icon: Sparkles, href: '/queue' },
          { label: 'Trend clusters', value: 4, icon: TrendingUp, href: '/intelligence' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{loading ? '—' : value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Opportunities */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              Today's Opportunities
            </h2>
            <Link href="/intelligence">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.slice(0, 3).map((opp) => (
                <Link key={opp.id} href={`/intelligence?opp=${opp.id}`}>
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {opp.title}
                      </h3>
                      <span className={cn(
                        'text-xs font-mono flex-shrink-0 px-1.5 py-0.5 rounded',
                        opp.overall_score >= 85 ? 'score-high' : opp.overall_score >= 70 ? 'score-mid' : 'score-low'
                      )}>
                        {opp.overall_score}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{opp.why_it_matters}</p>
                    <div className="flex items-center gap-2">
                      {opp.angle_type && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {opp.angle_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link href="/studio">
            <Button className="w-full gap-2 mt-2">
              <PenSquare className="w-4 h-4" />
              Generate Today's Posts
            </Button>
          </Link>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Drafts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Approval Queue
              </h2>
              <Link href="/queue">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.slice(0, 3).map(draft => (
                  <Link key={draft.id} href={`/studio/${draft.id}`}>
                    <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <PlatformBadge platform={draft.platform} />
                        <StatusBadge status={draft.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{draft.hook || draft.body.slice(0, 80)}...</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Learning signal */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-sm">Learning Signal</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {WEEKLY_LEARNING_REPORT.recommendations[0]}
            </p>
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1">
                View full report <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
