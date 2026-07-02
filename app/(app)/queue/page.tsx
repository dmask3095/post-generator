'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { MOCK_DRAFTS } from '@/lib/mock-data';
import type { ContentDraft } from '@/lib/database.types';
import { PlatformBadge, StatusBadge, ScoreBand } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SquareCheck as CheckSquare, Check, X, Copy, RefreshCw, ArrowRight, Loader as Loader2 } from 'lucide-react';

type FilterStatus = 'all' | 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'rejected';

export default function QueuePage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDrafts();
  }, [user]);

  const loadDrafts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('content_drafts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const db = data ?? [];
    setDrafts(db.length > 0 ? db : MOCK_DRAFTS.map((d, i) => ({ ...d, id: `mock-draft-${i}`, user_id: user.id, opportunity_id: null, idea_id: null, published_at: null, external_post_id: null, external_post_url: null, scheduled_at: null, generation_params: {}, created_at: new Date(Date.now() - i * 3600000).toISOString(), updated_at: new Date().toISOString() })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setActing(id);
    if (id.startsWith('mock-')) {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: status as ContentDraft['status'] } : d));
      toast.success(`Status updated (demo mode)`);
      setActing(null);
      return;
    }
    const endpoint = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : null;
    if (endpoint) {
      const res = await fetch(`/api/drafts/${id}/${endpoint}`, { method: 'POST' });
      if (res.ok) {
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: status as ContentDraft['status'] } : d));
        toast.success(`Draft ${status}`);
      } else {
        toast.error('Action failed');
      }
    } else {
      await supabase.from('content_drafts').update({ status: status as ContentDraft['status'] }).eq('id', id);
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: status as ContentDraft['status'] } : d));
    }
    setActing(null);
  };

  const copyToClipboard = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  const filtered = filter === 'all' ? drafts : drafts.filter(d => d.status === filter);

  const counts: Record<string, number> = drafts.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Approval Queue
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review, approve, and manage all your drafts.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'draft', 'needs_review', 'approved', 'scheduled', 'published', 'rejected'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
            {f !== 'all' && counts[f] ? (
              <span className="ml-1 opacity-70">({counts[f]})</span>
            ) : f === 'all' ? (
              <span className="ml-1 opacity-70">({drafts.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drafts here</p>
          <p className="text-sm mt-1">Generate posts in the Studio to fill this queue.</p>
          <Link href="/studio"><Button className="mt-4 gap-2">Go to Studio</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(draft => (
            <div key={draft.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={draft.platform} />
                  <StatusBadge status={draft.status} />
                  <span className="text-xs text-muted-foreground">{draft.post_type?.replace(/_/g, ' ')}</span>
                </div>
                <Link href={`/studio/${draft.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                    Edit <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {draft.hook && <p className="font-medium text-sm mb-2">{draft.hook}</p>}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 mb-3">{draft.body}</p>

              <ScoreBand
                brand_fit={draft.brand_fit_score}
                originality={draft.originality_score}
                virality={draft.virality_score}
                clarity={draft.clarity_score}
                cliche_risk={draft.cliche_risk_score}
                overall={draft.overall_score}
              />

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 flex-wrap">
                {draft.status !== 'approved' && draft.status !== 'published' && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                    disabled={acting === draft.id}
                    onClick={() => updateStatus(draft.id, 'approved')}
                  >
                    {acting === draft.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Approve
                  </Button>
                )}
                {draft.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5 h-7 text-xs"
                    disabled={acting === draft.id}
                    onClick={() => updateStatus(draft.id, 'rejected')}
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  onClick={() => copyToClipboard(draft.body)}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
                {draft.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => updateStatus(draft.id, 'published')}
                  >
                    Mark Published
                  </Button>
                )}
                {draft.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-7 text-xs text-muted-foreground"
                    onClick={() => updateStatus(draft.id, 'archived')}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
