'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { DEFAULT_BRAND_PROFILE } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Zap, ArrowRight, ArrowLeft, Loader as Loader2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'brand', label: 'Brand Position' },
  { id: 'audience', label: 'Audience' },
  { id: 'topics', label: 'Topics & Voice' },
  { id: 'goals', label: 'Goals' },
];

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  };

  const remove = (v: string) => onChange(values.filter(x => x !== v));

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="bg-secondary border-border"
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map(v => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="ml-0.5 rounded hover:text-foreground text-muted-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    positioning: [...DEFAULT_BRAND_PROFILE.positioning],
    audiences: [...DEFAULT_BRAND_PROFILE.audiences],
    topics: [...DEFAULT_BRAND_PROFILE.topics],
    toneDescriptors: [...DEFAULT_BRAND_PROFILE.tone_descriptors],
    bannedPhrases: [...DEFAULT_BRAND_PROFILE.banned_phrases],
    dailyLinkedin: 2,
    dailyX: 2,
    linkedinProfile: '',
    xProfile: '',
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const complete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        display_name: form.displayName,
        onboarding_completed: true,
      }).eq('id', user.id);

      const existing = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (existing.data) {
        await supabase.from('brand_profiles').update({
          positioning: form.positioning,
          audiences: form.audiences,
          topics: form.topics,
          tone_descriptors: form.toneDescriptors,
          banned_phrases: form.bannedPhrases,
          daily_linkedin_target: form.dailyLinkedin,
          daily_x_target: form.dailyX,
        }).eq('user_id', user.id);
      } else {
        await supabase.from('brand_profiles').insert({
          user_id: user.id,
          positioning: form.positioning,
          audiences: form.audiences,
          topics: form.topics,
          tone_descriptors: form.toneDescriptors,
          style_rules: {},
          banned_phrases: form.bannedPhrases,
          preferred_formats: DEFAULT_BRAND_PROFILE.preferred_formats,
          daily_linkedin_target: form.dailyLinkedin,
          daily_x_target: form.dailyX,
        });
      }

      await supabase.from('app_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' });
      await supabase.from('email_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id' });

      toast.success('Brand profile saved!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const canNext = step === 0 ? form.displayName.trim().length > 0 : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm">SignalScript</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 text-primary ring-2 ring-primary/40' :
                'bg-secondary text-muted-foreground'
              )}>
                {i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                i === step ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1 hidden sm:block" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Brand Position</h2>
                <p className="text-sm text-muted-foreground">How do you position yourself? We've pre-filled Sejal's profile.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Your name</Label>
                <Input
                  value={form.displayName}
                  onChange={e => update('displayName', e.target.value)}
                  placeholder="Sejal Kishor Daterao"
                  className="bg-secondary"
                />
              </div>
              <TagInput
                label="Brand positioning (what you are)"
                values={form.positioning}
                onChange={v => update('positioning', v)}
                placeholder="e.g. product thinker"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Target Audience</h2>
                <p className="text-sm text-muted-foreground">Who are you writing for?</p>
              </div>
              <TagInput
                label="Audience types"
                values={form.audiences}
                onChange={v => update('audiences', v)}
                placeholder="e.g. founders"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Topics & Voice</h2>
                <p className="text-sm text-muted-foreground">What topics and tone define your brand?</p>
              </div>
              <TagInput
                label="Content topics"
                values={form.topics}
                onChange={v => update('topics', v)}
                placeholder="e.g. AI, startups"
              />
              <TagInput
                label="Tone descriptors"
                values={form.toneDescriptors}
                onChange={v => update('toneDescriptors', v)}
                placeholder="e.g. concise, witty"
              />
              <TagInput
                label="Banned phrases (avoid these)"
                values={form.bannedPhrases}
                onChange={v => update('bannedPhrases', v)}
                placeholder="e.g. game changer"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Posting Goals</h2>
                <p className="text-sm text-muted-foreground">How many posts per day do you want to create?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>LinkedIn posts/day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={form.dailyLinkedin}
                    onChange={e => update('dailyLinkedin', parseInt(e.target.value) || 2)}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>X posts/day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={form.dailyX}
                    onChange={e => update('dailyX', parseInt(e.target.value) || 2)}
                    className="bg-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>LinkedIn profile URL (optional)</Label>
                  <Input
                    value={form.linkedinProfile}
                    onChange={e => update('linkedinProfile', e.target.value)}
                    placeholder="linkedin.com/in/..."
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>X handle (optional)</Label>
                  <Input
                    value={form.xProfile}
                    onChange={e => update('xProfile', e.target.value)}
                    placeholder="@handle"
                    className="bg-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={complete} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Launch SignalScript
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
