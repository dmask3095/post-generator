'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { BrandProfile, AppSettings, EmailPreferences, SocialAccount } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Brain, Globe, Mail, Link as LinkIcon, Key, Shield, ChevronRight, Check, X, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  { id: 'brand', label: 'Brand Voice', icon: Brain },
  { id: 'social', label: 'Social Accounts', icon: Globe },
  { id: 'email', label: 'Email Schedule', icon: Mail },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'data', label: 'Data & Privacy', icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [section, setSection] = useState('brand');
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const [brandRes, settingsRes, emailRes, socialRes] = await Promise.all([
      supabase.from('brand_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('app_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('email_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('social_accounts').select('*').eq('user_id', user.id),
    ]);
    setBrand(brandRes.data);
    setSettings(settingsRes.data);
    setEmailPrefs(emailRes.data);
    setSocialAccounts(socialRes.data ?? []);
    setLoading(false);
  };

  const saveBrand = async () => {
    if (!user || !brand) return;
    setSaving(true);
    const { error } = await supabase.from('brand_profiles').update({
      positioning: brand.positioning,
      audiences: brand.audiences,
      topics: brand.topics,
      tone_descriptors: brand.tone_descriptors,
      banned_phrases: brand.banned_phrases,
      daily_linkedin_target: brand.daily_linkedin_target,
      daily_x_target: brand.daily_x_target,
    }).eq('user_id', user.id);
    if (error) toast.error('Save failed');
    else toast.success('Brand profile updated');
    setSaving(false);
  };

  const saveEmailPrefs = async () => {
    if (!user || !emailPrefs) return;
    setSaving(true);
    await supabase.from('email_preferences').upsert({ ...emailPrefs, user_id: user.id }, { onConflict: 'user_id' });
    toast.success('Email preferences saved');
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your brand, integrations, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Section nav */}
        <nav className="space-y-1">
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all',
                section === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Section content */}
        <div className="sm:col-span-3">
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-6 h-64 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              {section === 'brand' && (
                <div className="space-y-6">
                  <h2 className="font-semibold">Brand Voice</h2>
                  {brand ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Positioning</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {brand.positioning.map(p => (
                              <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Tone descriptors</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {brand.tone_descriptors.map(t => (
                              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Topics</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {brand.topics.map(t => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">LinkedIn posts/day</Label>
                            <Input
                              type="number"
                              value={brand.daily_linkedin_target}
                              onChange={e => setBrand(b => b ? { ...b, daily_linkedin_target: parseInt(e.target.value) || 2 } : b)}
                              className="bg-secondary border-border mt-1 h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">X posts/day</Label>
                            <Input
                              type="number"
                              value={brand.daily_x_target}
                              onChange={e => setBrand(b => b ? { ...b, daily_x_target: parseInt(e.target.value) || 2 } : b)}
                              className="bg-secondary border-border mt-1 h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveBrand} disabled={saving} size="sm" className="gap-2">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Save Changes
                        </Button>
                        <Link href="/onboarding">
                          <Button variant="outline" size="sm">Re-run Onboarding</Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No brand profile yet.</p>
                      <Link href="/onboarding"><Button className="mt-3">Complete Onboarding</Button></Link>
                    </div>
                  )}
                </div>
              )}

              {section === 'social' && (
                <div className="space-y-6">
                  <h2 className="font-semibold">Social Accounts</h2>
                  <div className="space-y-3">
                    {(['linkedin', 'x'] as const).map(platform => {
                      const account = socialAccounts.find(a => a.platform === platform);
                      return (
                        <div key={platform} className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                          <div>
                            <div className="font-medium text-sm capitalize">{platform === 'x' ? 'X (Twitter)' : 'LinkedIn'}</div>
                            {account?.is_connected ? (
                              <div className="text-xs text-emerald-400 mt-0.5">Connected as @{account.handle}</div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-0.5">Not connected — Manual mode active</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {account?.is_connected ? (
                              <Badge variant="secondary" className="text-xs gap-1 text-emerald-400 border-emerald-400/20">
                                <Check className="w-3 h-3" /> Connected
                              </Badge>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled>
                                <LinkIcon className="w-3 h-3" />
                                Connect (Coming soon)
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                    <p className="text-xs text-amber-400">
                      Automatic publishing requires LinkedIn/X API credentials. Manual mode is always available — copy approved posts and publish directly.
                    </p>
                  </div>
                </div>
              )}

              {section === 'email' && (
                <div className="space-y-6">
                  <h2 className="font-semibold">Email Schedule</h2>
                  {emailPrefs ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Daily draft email</div>
                          <div className="text-xs text-muted-foreground">Receive today's drafts every morning</div>
                        </div>
                        <Switch
                          checked={emailPrefs.daily_draft_email_enabled}
                          onCheckedChange={v => setEmailPrefs(p => p ? { ...p, daily_draft_email_enabled: v } : p)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Send at</Label>
                        <Input
                          type="time"
                          value={emailPrefs.daily_email_time}
                          onChange={e => setEmailPrefs(p => p ? { ...p, daily_email_time: e.target.value } : p)}
                          className="bg-secondary border-border w-32"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Weekly report</div>
                          <div className="text-xs text-muted-foreground">Performance report every Monday</div>
                        </div>
                        <Switch
                          checked={emailPrefs.weekly_report_enabled}
                          onCheckedChange={v => setEmailPrefs(p => p ? { ...p, weekly_report_enabled: v } : p)}
                        />
                      </div>
                      <Button onClick={saveEmailPrefs} disabled={saving} size="sm" className="gap-2">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Save Preferences
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading preferences...</p>
                  )}
                </div>
              )}

              {section === 'api' && (
                <div className="space-y-4">
                  <h2 className="font-semibold">API Keys Status</h2>
                  <p className="text-sm text-muted-foreground">Configure environment variables to enable external features.</p>
                  {[
                    { key: 'OPENAI_API_KEY', label: 'OpenAI', desc: 'Required for AI content generation' },
                    { key: 'RESEND_API_KEY', label: 'Resend', desc: 'Required for daily draft emails' },
                    { key: 'LINKEDIN_CLIENT_ID', label: 'LinkedIn OAuth', desc: 'Required for auto-publishing to LinkedIn' },
                    { key: 'X_CLIENT_ID', label: 'X OAuth', desc: 'Required for auto-publishing to X' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs text-amber-400 border-amber-400/20">
                        Configure in .env
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {section === 'data' && (
                <div className="space-y-4">
                  <h2 className="font-semibold">Data & Privacy</h2>
                  <p className="text-sm text-muted-foreground">All data is stored in your Supabase project with row-level security.</p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                      Export my data (CSV)
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                      Delete all drafts
                    </Button>
                    <Button variant="destructive" size="sm" className="w-full justify-start gap-2">
                      Delete my account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
