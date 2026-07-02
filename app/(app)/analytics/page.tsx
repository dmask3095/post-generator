'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { MOCK_DRAFTS, WEEKLY_LEARNING_REPORT } from '@/lib/mock-data';
import type { ContentDraft, PostMetrics } from '@/lib/database.types';
import { PlatformBadge } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChartBar as BarChart3, TrendingUp, Lightbulb, Plus, Check, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [publishedDrafts, setPublishedDrafts] = useState<ContentDraft[]>([]);
  const [metrics, setMetrics] = useState<PostMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricForm, setMetricForm] = useState<Record<string, number>>({});
  const [selectedDraft, setSelectedDraft] = useState<ContentDraft | null>(null);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [draftsRes, metricsRes] = await Promise.all([
      supabase.from('content_drafts').select('*').eq('user_id', user.id).in('status', ['published', 'approved']).order('created_at', { ascending: false }),
      supabase.from('post_metrics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    const dbDrafts = draftsRes.data ?? [];
    const mockPub = MOCK_DRAFTS.slice(0, 2).map((d, i) => ({ ...d, id: `mock-draft-${i}`, user_id: user.id, status: 'published' as const, opportunity_id: null, idea_id: null, published_at: new Date().toISOString(), external_post_id: null, external_post_url: null, scheduled_at: null, generation_params: {}, created_at: new Date(Date.now() - i * 86400000).toISOString(), updated_at: new Date().toISOString() })) as unknown as ContentDraft[];

    setPublishedDrafts(dbDrafts.length > 0 ? dbDrafts : mockPub);
    setMetrics(metricsRes.data ?? []);
    setLoading(false);
  };

  const openMetricEntry = (draft: ContentDraft) => {
    setSelectedDraft(draft);
    const existing = metrics.find(m => m.draft_id === draft.id);
    setMetricForm({
      impressions: existing?.impressions ?? 0,
      likes: existing?.likes ?? 0,
      comments: existing?.comments ?? 0,
      shares: existing?.shares ?? 0,
      saves: existing?.saves ?? 0,
      clicks: existing?.clicks ?? 0,
      profile_visits: existing?.profile_visits ?? 0,
      followers_gained: existing?.followers_gained ?? 0,
    });
  };

  const saveMetrics = async () => {
    if (!user || !selectedDraft || selectedDraft.id.startsWith('mock-')) {
      toast.success('Metrics saved (demo mode)');
      setSelectedDraft(null);
      return;
    }
    setSavingMetrics(true);
    const imp = metricForm.impressions || 0;
    const total = (metricForm.likes || 0) + (metricForm.comments || 0) + (metricForm.shares || 0) + (metricForm.saves || 0) + (metricForm.clicks || 0);
    const engRate = imp > 0 ? Math.round((total / imp) * 1000) / 10 : 0;

    const res = await fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId: selectedDraft.id, platform: selectedDraft.platform, ...metricForm, engagement_rate: engRate }),
    });

    if (res.ok) {
      toast.success('Metrics saved');
      loadData();
    } else {
      toast.error('Failed to save metrics');
    }
    setSavingMetrics(false);
    setSelectedDraft(null);
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/analytics/weekly-report', { method: 'POST' });
      const data = await res.json();
      if (res.ok) toast.success('Weekly report generated');
      else toast.error('Failed to generate report');
    } catch {
      toast.error('Failed');
    }
    setGeneratingReport(false);
  };

  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalLikes = metrics.reduce((s, m) => s + m.likes, 0);
  const totalComments = metrics.reduce((s, m) => s + m.comments, 0);
  const avgEngRate = metrics.length > 0 ? (metrics.reduce((s, m) => s + m.engagement_rate, 0) / metrics.length).toFixed(1) : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track what works and improve your content strategy.</p>
        </div>
        <Button onClick={generateReport} disabled={generatingReport} variant="outline" size="sm" className="gap-2">
          {generatingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
          Generate Weekly Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Impressions', value: metrics.length > 0 ? totalImpressions.toLocaleString() : '—' },
          { label: 'Total Likes', value: metrics.length > 0 ? totalLikes.toLocaleString() : '—' },
          { label: 'Comments', value: metrics.length > 0 ? totalComments.toLocaleString() : '—' },
          { label: 'Avg Engagement', value: metrics.length > 0 ? `${avgEngRate}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Published posts with metric entry */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">Posts — Enter Metrics</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              {publishedDrafts.map(draft => {
                const m = metrics.find(m => m.draft_id === draft.id);
                return (
                  <div key={draft.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <PlatformBadge platform={draft.platform} />
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {draft.hook || draft.body.slice(0, 80)}...
                        </p>
                        {m && (
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{m.impressions.toLocaleString()} impr.</span>
                            <span>{m.likes} likes</span>
                            <span>{m.comments} comments</span>
                            <span className="text-emerald-400">{m.engagement_rate}% eng.</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs flex-shrink-0"
                        onClick={() => openMetricEntry(draft)}
                      >
                        <Plus className="w-3 h-3" />
                        {m ? 'Update' : 'Add'} Metrics
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Learning report */}
        <div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-sm">Weekly Learning Report</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{WEEKLY_LEARNING_REPORT.summary}</p>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-emerald-400 mb-1.5">What worked</div>
                <ul className="space-y-1">
                  {WEEKLY_LEARNING_REPORT.what_worked.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-semibold text-amber-400 mb-1.5">Recommendations</div>
                <ul className="space-y-1">
                  {WEEKLY_LEARNING_REPORT.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <TrendingUp className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric entry dialog */}
      <Dialog open={!!selectedDraft} onOpenChange={o => !o && setSelectedDraft(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Metrics</DialogTitle>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4 mt-2">
              <p className="text-xs text-muted-foreground">
                {selectedDraft.hook || selectedDraft.body.slice(0, 60)}...
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['impressions', 'likes', 'comments', 'shares', 'saves', 'clicks', 'profile_visits', 'followers_gained'].map(key => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={metricForm[key] ?? 0}
                      onChange={e => setMetricForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedDraft(null)}>Cancel</Button>
                <Button size="sm" disabled={savingMetrics} onClick={saveMetrics} className="gap-2">
                  {savingMetrics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Metrics
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
