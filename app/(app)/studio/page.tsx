'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { MOCK_DRAFTS, MOCK_OPPORTUNITIES } from '@/lib/mock-data';
import type { ContentDraft, ContentOpportunity } from '@/lib/database.types';
import { PlatformBadge, StatusBadge, ScoreBand } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SquarePen as PenSquare, Sparkles, Linkedin, Twitter, Loader as Loader2, ArrowRight } from 'lucide-react';

export default function StudioPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [draftsRes, oppsRes] = await Promise.all([
      supabase.from('content_drafts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('content_opportunities').select('*').eq('user_id', user.id).in('status', ['new', 'saved']).order('overall_score', { ascending: false }).limit(10),
    ]);

    const dbDrafts = draftsRes.data ?? [];
    const dbOpps = oppsRes.data ?? [];

    setDrafts(dbDrafts.length > 0 ? dbDrafts : MOCK_DRAFTS.map((d, i) => ({ ...d, id: `mock-draft-${i}`, user_id: user.id, opportunity_id: null, idea_id: null, published_at: null, external_post_id: null, external_post_url: null, scheduled_at: null, generation_params: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
    setOpportunities(dbOpps.length > 0 ? dbOpps : MOCK_OPPORTUNITIES.slice(0, 5).map((o, i) => ({ ...o, id: `mock-opp-${i}`, user_id: user.id, cluster_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
    setLoading(false);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const opp = opportunities.find(o => o.id === selectedOpp) || opportunities[0];
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp && !opp.id.startsWith('mock-') ? opp.id : null,
          opportunityData: opp,
          platforms: ['linkedin', 'x'],
          counts: { linkedin: 2, x: 2 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Generation failed');
      toast.success(`Generated ${data.drafts?.length ?? 0} new drafts`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const todayDrafts = drafts.filter(d => {
    const created = new Date(d.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });

  const linkedinCount = todayDrafts.filter(d => d.platform === 'linkedin').length;
  const xCount = todayDrafts.filter(d => d.platform === 'x').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PenSquare className="w-5 h-5 text-primary" />
          Content Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate, review, and manage your daily posts.</p>
      </div>

      {/* Generation panel */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">Generate Today's Posts</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className={linkedinCount >= 2 ? 'text-emerald-400' : 'text-amber-400'}>
                  {linkedinCount}/2
                </span>
                LinkedIn
              </span>
              <span className="flex items-center gap-1">
                <span className={xCount >= 2 ? 'text-emerald-400' : 'text-amber-400'}>
                  {xCount}/2
                </span>
                X posts
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedOpp} onValueChange={setSelectedOpp}>
              <SelectTrigger className="w-52 bg-secondary border-border text-sm h-9">
                <SelectValue placeholder="Choose opportunity..." />
              </SelectTrigger>
              <SelectContent>
                {opportunities.map(opp => (
                  <SelectItem key={opp.id} value={opp.id}>
                    <span className="truncate">{opp.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={generating} className="gap-2 flex-shrink-0">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Draft list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map(draft => (
            <Link key={draft.id} href={`/studio/${draft.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={draft.platform} />
                    <StatusBadge status={draft.status} />
                    <span className="text-xs text-muted-foreground">{draft.post_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>

                {draft.hook && (
                  <p className="font-medium text-sm mb-2 group-hover:text-primary transition-colors">{draft.hook}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{draft.body.slice(0, 140)}...</p>

                <ScoreBand
                  brand_fit={draft.brand_fit_score}
                  originality={draft.originality_score}
                  virality={draft.virality_score}
                  clarity={draft.clarity_score}
                  cliche_risk={draft.cliche_risk_score}
                  overall={draft.overall_score}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
