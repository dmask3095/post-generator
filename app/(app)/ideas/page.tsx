'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Idea } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lightbulb, Plus, ArrowRight, Loader as Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function IdeasPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', source_url: '', source_title: '' });

  useEffect(() => {
    if (!user) return;
    loadIdeas();
  }, [user]);

  const loadIdeas = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('ideas').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false });
    setIdeas(data ?? []);
    setLoading(false);
  };

  const saveIdea = async () => {
    if (!user || !form.body.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      title: form.title || null,
      body: form.body,
      source_url: form.source_url || null,
      source_title: form.source_title || null,
    });
    if (error) toast.error('Save failed');
    else {
      toast.success('Idea saved');
      setForm({ title: '', body: '', source_url: '', source_title: '' });
      setShowAdd(false);
      loadIdeas();
    }
    setSaving(false);
  };

  const archiveIdea = async (id: string) => {
    await supabase.from('ideas').update({ status: 'archived' }).eq('id', id);
    setIdeas(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Idea Bank
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Capture reading notes, quotes, and observations to generate posts from.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Idea
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No ideas yet</p>
          <p className="text-sm mt-1">Capture reading notes, book insights, and observations here.</p>
          <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2"><Plus className="w-4 h-4" />Add first idea</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <div key={idea.id} className="bg-card border border-border rounded-lg p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {idea.title && <div className="font-medium text-sm mb-1">{idea.title}</div>}
                  <p className="text-sm text-muted-foreground line-clamp-3">{idea.body}</p>
                  {idea.source_title && (
                    <div className="text-xs text-muted-foreground/70 mt-1">From: {idea.source_title}</div>
                  )}
                </div>
                <button
                  onClick={() => archiveIdea(idea.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Title (optional)</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Distribution beats features" className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Idea / Note *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your idea, quote, or observation here..." className="bg-secondary min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Source title</Label>
                <Input value={form.source_title} onChange={e => setForm(f => ({ ...f, source_title: e.target.value }))} placeholder="Book / article name" className="bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Source URL</Label>
                <Input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} placeholder="https://..." className="bg-secondary" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" disabled={saving || !form.body.trim()} onClick={saveIdea} className="gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Idea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
