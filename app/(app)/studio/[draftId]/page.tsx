'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { MOCK_DRAFTS } from '@/lib/mock-data';
import type { ContentDraft, DraftVersion, TransformInstruction } from '@/lib/database.types';
import { ScoreBand, PlatformBadge, StatusBadge } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Check, X, Copy, Clock, Loader as Loader2, ChevronDown, ChevronUp,
  History, Lightbulb, ArrowLeft, Image as ImageIcon, Sparkles, RefreshCw,
  ExternalLink, Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TRANSFORM_BUTTONS: { instruction: TransformInstruction; label: string }[] = [
  { instruction: 'make_sharper', label: 'Make sharper' },
  { instruction: 'make_more_contrarian', label: 'More contrarian' },
  { instruction: 'make_more_personal', label: 'More personal' },
  { instruction: 'make_shorter', label: 'Make shorter' },
  { instruction: 'make_more_witty', label: 'More witty' },
  { instruction: 'add_business_lens', label: 'Business lens' },
  { instruction: 'add_product_lens', label: 'Product lens' },
  { instruction: 'add_founder_lens', label: 'Founder lens' },
  { instruction: 'remove_cliches', label: 'Remove clichés' },
  { instruction: 'turn_into_x_thread', label: 'Into thread' },
  { instruction: 'turn_into_linkedin_carousel', label: 'Into carousel' },
];

interface VisualConcept {
  imageUrl: string | null;
  imagePrompt: string;
  concept: string;
  style: string;
  alternativeIdeas: { description: string; style: string }[];
  captionSuggestion: string;
}

export default function DraftEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [body, setBody] = useState('');
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transforming, setTransforming] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showRationale, setShowRationale] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');
  const [visual, setVisual] = useState<VisualConcept | null>(null);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'visual'>('edit');

  useEffect(() => {
    if (!id) return;
    if (id.startsWith('mock-draft-')) {
      const idx = parseInt(id.replace('mock-draft-', ''));
      const mockDraft = MOCK_DRAFTS[isNaN(idx) ? 0 : idx % MOCK_DRAFTS.length];
      if (mockDraft) {
        const d: ContentDraft = {
          ...mockDraft, id, user_id: 'demo', opportunity_id: null, idea_id: null,
          published_at: null, external_post_id: null, external_post_url: null,
          scheduled_at: null, generation_params: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        setDraft(d);
        setBody(d.body);
      }
      setLoading(false);
      return;
    }
    if (user) loadDraft();
  }, [user, id]);

  const loadDraft = async () => {
    if (!user || !id) return;
    setLoading(true);
    const [draftRes, versionsRes] = await Promise.all([
      supabase.from('content_drafts').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('draft_versions').select('*').eq('draft_id', id).order('version_number', { ascending: false }),
    ]);
    if (draftRes.data) { setDraft(draftRes.data); setBody(draftRes.data.body); }
    setVersions(versionsRes.data ?? []);
    setLoading(false);
  };

  const saveBody = async () => {
    if (!draft || id.startsWith('mock-')) { toast.success('Draft updated (demo mode)'); return; }
    setSaving(true);
    const { error } = await supabase.from('content_drafts').update({ body }).eq('id', id);
    if (error) toast.error('Save failed'); else toast.success('Draft saved');
    setSaving(false);
  };

  const approve = async () => {
    if (id.startsWith('mock-')) { setDraft(p => p ? { ...p, status: 'approved' } : p); toast.success('Approved (demo mode)'); return; }
    const res = await fetch(`/api/drafts/${id}/approve`, { method: 'POST' });
    if (res.ok) { setDraft(p => p ? { ...p, status: 'approved' } : p); toast.success('Draft approved'); }
    else toast.error('Failed to approve');
  };

  const reject = async () => {
    if (id.startsWith('mock-')) { setDraft(p => p ? { ...p, status: 'rejected' } : p); toast.success('Rejected (demo mode)'); return; }
    const res = await fetch(`/api/drafts/${id}/reject`, { method: 'POST' });
    if (res.ok) { setDraft(p => p ? { ...p, status: 'rejected' } : p); toast('Draft rejected'); }
  };

  const copyToClipboard = async () => { await navigator.clipboard.writeText(body); toast.success('Copied to clipboard'); };

  const schedule = async () => {
    if (!scheduleDate) { toast.error('Pick a date/time first'); return; }
    if (id.startsWith('mock-')) { setDraft(p => p ? { ...p, status: 'scheduled', scheduled_at: scheduleDate } : p); toast.success('Scheduled (demo mode)'); return; }
    const res = await fetch(`/api/drafts/${id}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: scheduleDate, mode: 'manual' }),
    });
    const data = await res.json();
    if (res.ok) { setDraft(p => p ? { ...p, status: 'scheduled', scheduled_at: scheduleDate } : p); toast.success('Post scheduled'); }
    else toast.error(data.error?.message || 'Schedule failed');
  };

  const transform = async (instruction: TransformInstruction) => {
    setTransforming(instruction);
    try {
      const res = await fetch('/api/content/transform', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: id.startsWith('mock-') ? null : id, currentBody: body, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Transform failed');
      setBody(data.body);
      if (data.scores && draft) {
        setDraft(p => p ? {
          ...p,
          brand_fit_score: data.scores.brand_fit ?? p.brand_fit_score,
          originality_score: data.scores.originality ?? p.originality_score,
          virality_score: data.scores.virality ?? p.virality_score,
          clarity_score: data.scores.clarity ?? p.clarity_score,
          cliche_risk_score: data.scores.cliche_risk ?? p.cliche_risk_score,
          overall_score: data.scores.overall ?? p.overall_score,
        } : p);
      }
      toast.success(`Applied: ${instruction.replace(/_/g, ' ')}`);
      // Invalidate visual when content changes
      setVisual(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTransforming(null);
    }
  };

  const generateVisual = async () => {
    if (!draft) return;
    setGeneratingVisual(true);
    setActiveTab('visual');
    try {
      const res = await fetch('/api/content/visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postBody: body, platform: draft.platform, hook: draft.hook, draftId: id.startsWith('mock-') ? null : id }),
      });
      const data = await res.json();
      if (res.ok) { setVisual(data); setShowVisual(true); }
      else toast.error('Visual generation failed');
    } catch {
      toast.error('Visual generation failed');
    } finally {
      setGeneratingVisual(false);
    }
  };

  const charCount = body.length;
  const charLimit = draft?.platform === 'x' ? 280 : 3000;
  const isOverLimit = draft?.platform === 'x' && charCount > 280;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!draft) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Draft not found.</p>
      <Link href="/studio"><Button variant="outline" className="mt-4">Back to Studio</Button></Link>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/studio">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Studio
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <PlatformBadge platform={draft.platform} />
            <StatusBadge status={draft.status} />
            <span className="text-xs text-muted-foreground capitalize">{draft.post_type?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generateVisual}
            disabled={generatingVisual}
            variant="outline"
            size="sm"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            {generatingVisual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            {generatingVisual ? 'Generating visual...' : visual ? 'Regenerate visual' : 'Generate visual'}
          </Button>
        </div>
      </div>

      {/* Tab bar when visual is available */}
      {visual && (
        <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('edit')}
            className={cn('px-4 py-1.5 rounded text-sm font-medium transition-all', activeTab === 'edit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            Edit Post
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={cn('px-4 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5', activeTab === 'visual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Visual
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'edit' ? (
            <>
              {/* Hook */}
              {draft.hook && (
                <div className="text-base font-semibold text-foreground leading-snug">{draft.hook}</div>
              )}

              {/* Body editor */}
              <div className="relative">
                <Textarea
                  value={body}
                  onChange={e => { setBody(e.target.value); setVisual(null); }}
                  className="min-h-[280px] bg-secondary border-border text-sm leading-relaxed resize-none"
                  placeholder="Post body..."
                />
                <div className={cn(
                  'absolute bottom-2 right-3 text-xs',
                  isOverLimit ? 'text-red-400 font-medium' : 'text-muted-foreground'
                )}>
                  {draft.platform === 'x' ? `${charCount}/280` : `${wordCount}w`}
                </div>
              </div>

              {/* Hashtags */}
              {draft.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {draft.hashtags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs text-blue-400">#{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={saveBody} disabled={saving} variant="outline" size="sm" className="gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save
                </Button>
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
                {draft.status !== 'approved' && (
                  <Button onClick={approve} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                {draft.status !== 'rejected' && (
                  <Button onClick={reject} variant="destructive" size="sm" className="gap-1.5">
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                )}
              </div>

              {/* Schedule */}
              {(draft.status === 'approved' || draft.status === 'scheduled') && (
                <div className="bg-secondary rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Schedule
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="flex-1 bg-card border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                    />
                    <Button onClick={schedule} size="sm" className="gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Schedule
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Manual mode — copy and post at scheduled time.</p>
                </div>
              )}
            </>
          ) : (
            /* Visual Tab */
            visual && (
              <div className="space-y-4">
                {/* Generated image */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {visual.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={visual.imageUrl}
                        alt="Generated visual"
                        className={cn('w-full object-cover', draft.platform === 'linkedin' ? 'aspect-video' : 'aspect-square')}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <a href={visual.imageUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg">
                            <ExternalLink className="w-3.5 h-3.5" /> Open full size
                          </Button>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      'flex items-center justify-center bg-secondary',
                      draft.platform === 'linkedin' ? 'aspect-video' : 'aspect-square'
                    )}>
                      <div className="text-center p-8">
                        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">Visual concept ready</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Add an OpenAI API key to generate images</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Concept</span>
                      <span className="text-xs text-muted-foreground/60 italic">{visual.style}</span>
                    </div>
                    <p className="text-sm text-foreground">{visual.concept}</p>
                  </div>
                </div>

                {/* Caption suggestion */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">How to use this</p>
                      <p className="text-sm text-foreground/80">{visual.captionSuggestion}</p>
                    </div>
                  </div>
                </div>

                {/* Image prompt (for custom generation) */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DALL-E Prompt</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(visual.imagePrompt); toast.success('Prompt copied'); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Copy prompt
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">{visual.imagePrompt}</p>
                </div>

                {/* Alternative ideas */}
                {visual.alternativeIdeas?.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" /> Alternative visuals
                    </h3>
                    <div className="space-y-2">
                      {visual.alternativeIdeas.map((alt, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary border border-border/50">
                          <p className="text-sm text-foreground">{alt.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 italic">{alt.style}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => setActiveTab('edit')} variant="outline" size="sm" className="w-full gap-2">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to editing
                </Button>
              </div>
            )
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Engagement tips for X */}
          {draft.platform === 'x' && (
            <div className={cn(
              'rounded-lg p-3 border text-xs',
              isOverLimit
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : charCount > 240
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-secondary border-border text-muted-foreground'
            )}>
              {isOverLimit
                ? `${charCount - 280} chars over limit — use "Make shorter"`
                : charCount > 240
                ? `${280 - charCount} chars remaining`
                : `${charCount}/280 characters`}
            </div>
          )}

          {/* Quality Scores */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Quality Scores</h3>
            <ScoreBand
              brand_fit={draft.brand_fit_score}
              originality={draft.originality_score}
              virality={draft.virality_score}
              clarity={draft.clarity_score}
              cliche_risk={draft.cliche_risk_score}
              overall={draft.overall_score}
            />
          </div>

          {/* Rationale */}
          {draft.rationale && (
            <div className="bg-card border border-border rounded-lg p-4">
              <button
                onClick={() => setShowRationale(r => !r)}
                className="flex items-center justify-between w-full text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Rationale
                </span>
                {showRationale ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRationale && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{draft.rationale}</p>
              )}
            </div>
          )}

          {/* Transform controls */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Transform
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TRANSFORM_BUTTONS.map(({ instruction, label }) => (
                <button
                  key={instruction}
                  disabled={!!transforming}
                  onClick={() => transform(instruction)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium border transition-all',
                    transforming === instruction
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-50'
                  )}
                >
                  {transforming === instruction ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {label}
                    </span>
                  ) : label}
                </button>
              ))}
            </div>
          </div>

          {/* Version history */}
          {versions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <button
                onClick={() => setShowVersions(v => !v)}
                className="flex items-center justify-between w-full text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" /> Versions ({versions.length})
                </span>
                {showVersions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showVersions && (
                <div className="mt-3 space-y-2">
                  {versions.slice(0, 5).map(v => (
                    <div key={v.id} className="p-2 rounded bg-secondary border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">v{v.version_number}</span>
                        <button onClick={() => { setBody(v.body); setVisual(null); }} className="text-xs text-primary hover:underline">
                          Restore
                        </button>
                      </div>
                      {v.change_instruction && (
                        <span className="text-xs text-muted-foreground italic">{v.change_instruction.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
