'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { MOCK_OPPORTUNITIES, MOCK_TREND_CLUSTERS } from '@/lib/mock-data';
import type { ContentOpportunity, TrendCluster } from '@/lib/database.types';
import { ScoreBand, ScoreBadge } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Radio, Sparkles, BookmarkPlus, X, TrendingUp, Users, Zap, TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IntelligencePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [clusters, setClusters] = useState<TrendCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContentOpportunity | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    const oppId = searchParams.get('opp');
    if (oppId && opportunities.length > 0) {
      const found = opportunities.find(o => o.id === oppId);
      if (found) setSelected(found);
    }
  }, [searchParams, opportunities]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [oppsRes, clustersRes] = await Promise.all([
      supabase.from('content_opportunities').select('*').eq('user_id', user.id).order('overall_score', { ascending: false }),
      supabase.from('trend_clusters').select('*').eq('user_id', user.id).order('momentum_score', { ascending: false }),
    ]);

    const dbOpps = oppsRes.data ?? [];
    const dbClusters = clustersRes.data ?? [];

    setClusters(dbClusters.length > 0 ? dbClusters : MOCK_TREND_CLUSTERS.map((c, i) => ({ ...c, id: `mock-cluster-${i}`, user_id: user.id, created_at: new Date().toISOString() })));
    setOpportunities(dbOpps.length > 0 ? dbOpps : MOCK_OPPORTUNITIES.map((o, i) => ({ ...o, id: `mock-opp-${i}`, user_id: user.id, cluster_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
    setLoading(false);
  };

  const dismiss = async (opp: ContentOpportunity) => {
    setOpportunities(prev => prev.filter(o => o.id !== opp.id));
    if (!opp.id.startsWith('mock-')) {
      await supabase.from('content_opportunities').update({ status: 'dismissed' }).eq('id', opp.id);
    }
  };

  const save = async (opp: ContentOpportunity) => {
    if (!opp.id.startsWith('mock-')) {
      await supabase.from('content_opportunities').update({ status: 'saved' }).eq('id', opp.id);
    }
    toast.success('Opportunity saved');
  };

  const generateFromOpportunity = async (opp: ContentOpportunity) => {
    setGenerating(true);
    setSelected(null);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id.startsWith('mock-') ? null : opp.id,
          opportunityData: opp,
          platforms: ['linkedin', 'x'],
          counts: { linkedin: 2, x: 2 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Generation failed');
      toast.success(`Generated ${data.drafts?.length ?? 0} drafts`);
      window.location.href = '/studio';
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Daily Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Today's trend clusters and content opportunities — scored for your brand.
        </p>
      </div>

      {/* Trend clusters */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Trend Clusters</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {clusters.map(cluster => (
              <div key={cluster.id} className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{cluster.category}</Badge>
                  <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded', cluster.momentum_score >= 85 ? 'score-high' : 'score-mid')}>
                    {cluster.momentum_score}
                  </span>
                </div>
                <h3 className="text-xs font-semibold line-clamp-2 leading-tight">{cluster.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cluster.source_count} sources</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunities */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Content Opportunities ({opportunities.length})
        </h2>
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map(opp => (
              <div
                key={opp.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold cursor-pointer hover:text-primary transition-colors mb-2"
                      onClick={() => setSelected(opp)}
                    >
                      {opp.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{opp.summary}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {opp.angle_type && (
                        <Badge variant="secondary" className="text-xs">
                          {opp.angle_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {opp.recommended_formats?.slice(0, 2).map(f => (
                        <Badge key={f} variant="outline" className="text-xs opacity-70">
                          {f.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold',
                      opp.overall_score >= 90 ? 'bg-emerald-400/10 text-emerald-400' :
                      opp.overall_score >= 80 ? 'bg-blue-400/10 text-blue-400' :
                      'bg-amber-400/10 text-amber-400'
                    )}>
                      {opp.overall_score}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => save(opp)} aria-label="Save">
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => dismiss(opp)} aria-label="Dismiss">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <ScoreBand
                    brand_fit={opp.brand_fit_score}
                    originality={opp.originality_score}
                    virality={opp.virality_score}
                    clarity={opp.clarity_score}
                    cliche_risk={opp.cliche_risk_score}
                    overall={opp.overall_score}
                  />
                  <Button
                    size="sm"
                    className="gap-1.5 ml-3 flex-shrink-0"
                    onClick={() => setSelected(opp)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunity detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg leading-tight">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</div>
                  <p className="text-sm">{selected.summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why It Matters</div>
                    <p className="text-sm text-muted-foreground">{selected.why_it_matters}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Differentiated Angle</div>
                    <p className="text-sm text-muted-foreground italic">"{selected.differentiated_angle}"</p>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scores</div>
                  <ScoreBand
                    brand_fit={selected.brand_fit_score}
                    originality={selected.originality_score}
                    virality={selected.virality_score}
                    clarity={selected.clarity_score}
                    cliche_risk={selected.cliche_risk_score}
                    overall={selected.overall_score}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                  <Button
                    className="gap-2"
                    disabled={generating}
                    onClick={() => generateFromOpportunity(selected)}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Posts
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
