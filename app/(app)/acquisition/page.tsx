'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Search, Plus, ExternalLink, Copy, Check, Users, Send, Clock3, BadgeCheck, TrendingUp, X, Save, ChevronDown, CircleDollarSign, MessageSquareText } from 'lucide-react';

const PLATFORMS = ['All platforms', 'Hacker News', 'Product Hunt', 'Reddit', 'Instagram', 'X', 'YouTube', 'LinkedIn', 'TikTok'] as const;
type Platform = typeof PLATFORMS[number];
type Prospect = {
  id: string; platform: string; name: string; role: string; profile_url: string; source_url: string;
  contact_method: string; contact_url: string; fit_reason: string; audience_relevance: string;
  outreach_subject: string; outreach_message: string; approval_status: string; follow_up_at: string | null;
  outreach_status: string; last_contacted_at: string | null; converted_at: string | null;
  affiliate_candidate: boolean; affiliate_status: string; affiliate_terms_verified: boolean;
  affiliate_terms_source: string | null; notes: string; created_at: string;
};

const discovery = [{
  key: 'onepin-soohyun-bae',
  platform: 'Product Hunt',
  name: 'Soohyun Bae',
  role: 'Founder, Onepin',
  profile_url: 'https://www.producthunt.com/products/onepin',
  source_url: 'https://www.producthunt.com/products/onepin',
  contact_method: 'Product Hunt forum or public email',
  contact_url: 'https://www.producthunt.com/products/onepin',
  fit_reason: 'Onepin’s maker says it is built for AI voiceovers in product videos, ads, and explainers. A launch-film workflow may be complementary; this is a hypothesis to validate with the founder.',
  audience_relevance: 'AI voiceover and product-video makers; no audience-size claim verified.',
  affiliate_candidate: false,
  outreach_subject: 'A launch-film idea for Onepin',
  outreach_message: 'Hi Soohyun — I saw your Product Hunt launch and your point about teams shipping AI voiceovers in product videos and explainers. CrossLoop turns a public product URL into a narrated launch film in social-ready formats. It may be a useful way to show Onepin itself in motion. If you have a launch or feature page coming up, would you be open to trying it and sharing candid feedback? https://crossloop.ai',
}];

const supabase: any = getSupabaseBrowserClient();

function StatusPill({ value }: { value: string }) {
  const color = value === 'sent' || value === 'converted' || value === 'approved' ? 'text-emerald-300 bg-emerald-400/10' :
    value === 'approved' || value === 'ready' ? 'text-sky-300 bg-sky-400/10' :
    value === 'rejected' || value === 'declined' ? 'text-rose-300 bg-rose-400/10' : 'text-amber-200 bg-amber-300/10';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${color}`}>{value.replaceAll('_', ' ')}</span>;
}

export default function AcquisitionPage() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [platform, setPlatform] = useState<Platform>('All platforms');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ platform: 'LinkedIn', name: '', role: '', profile_url: '', source_url: '', contact_method: '', contact_url: '', fit_reason: '', audience_relevance: '', outreach_subject: '', outreach_message: '', affiliate_candidate: false });

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from('crossloop_prospects').select('*').order('created_at', { ascending: false });
    if (queryError) setError(queryError.message.includes('crossloop_prospects') ? 'Run the new Supabase migration to activate saved leads.' : queryError.message);
    else setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => rows.filter((row) =>
    (platform === 'All platforms' || row.platform === platform) &&
    [row.name, row.role, row.fit_reason, row.platform].join(' ').toLowerCase().includes(search.toLowerCase())
  ), [rows, platform, search]);

  const sentCount = rows.filter((row) => row.outreach_status === 'sent').length;
  const convertedCount = rows.filter((row) => row.converted_at).length;
  const followUps = rows.filter((row) => row.follow_up_at && new Date(row.follow_up_at) <= new Date() && !row.converted_at).length;
  const affiliateCount = rows.filter((row) => row.affiliate_candidate).length;

  function openRow(row: Prospect) {
    setSelected(row); setDraft(row.outreach_message ?? ''); setSubject(row.outreach_subject ?? '');
    setFollowUp(row.follow_up_at ? new Date(row.follow_up_at).toISOString().slice(0, 16) : '');
  }

  async function update(id: string, changes: Record<string, unknown>) {
    const { error: updateError } = await supabase.from('crossloop_prospects').update(changes).eq('id', id);
    if (updateError) { setError(updateError.message); return false; }
    await load();
    if (selected?.id === id) setSelected({ ...selected, ...changes } as Prospect);
    return true;
  }

  async function addProspect(payload: Record<string, unknown>) {
    setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) { setError('Your session expired. Sign in again to save prospects.'); return false; }
    const { error: insertError } = await supabase.from('crossloop_prospects').insert({ ...payload, user_id: authData.user.id });
    if (insertError) { setError(insertError.message); return false; }
    setShowForm(false); setNotice('Lead added to your workspace.'); await load(); return true;
  }

  async function addDiscovery(item: typeof discovery[number]) {
    const exists = rows.some((row) => row.profile_url === item.profile_url);
    if (exists) { setNotice('This suggestion is already in your workspace.'); return; }
    await addProspect({ ...item, approval_status: 'draft', outreach_status: 'not_sent', affiliate_status: 'not_applicable', affiliate_terms_verified: false, notes: '' });
  }

  async function saveDraft() {
    if (!selected) return;
    const ok = await update(selected.id, { outreach_subject: subject, outreach_message: draft, follow_up_at: followUp ? new Date(followUp).toISOString() : null });
    if (ok) setNotice('Draft and follow-up saved.');
  }

  async function copyDraft() {
    await navigator.clipboard.writeText([subject ? `Subject: ${subject}` : '', draft].filter(Boolean).join('\n\n'));
    setNotice('Draft copied. It has not been sent.');
  }

  async function markSent() {
    if (!selected || !window.confirm('Confirm you sent this message outside the dashboard. This records the status only; it does not send anything.')) return;
    const ok = await update(selected.id, { outreach_status: 'sent', approval_status: 'approved', last_contacted_at: new Date().toISOString() });
    if (ok) setNotice('Marked sent based on your confirmation.');
  }

  async function trackConversion() {
    if (!selected || !window.confirm('Confirm this prospect became a paying CrossLoop customer?')) return;
    const ok = await update(selected.id, { converted_at: new Date().toISOString(), outreach_status: 'converted' });
    if (ok) setNotice('Conversion recorded.');
  }

  async function verifyAffiliateTerms() {
    if (!selected) return;
    const source = window.prompt('Paste the official affiliate terms or program source URL you reviewed:');
    if (!source) return;
    const ok = await update(selected.id, { affiliate_terms_verified: true, affiliate_terms_source: source });
    if (ok) setNotice('Affiliate terms source recorded. Confirm the terms before offering them.');
  }

  const card = 'rounded-2xl border border-white/10 bg-white/[0.035]';
  const input = 'w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-300/50';

  return (
    <div className="min-h-screen px-5 py-8 md:px-8 lg:px-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-cyan-300">CrossLoop.ai · Growth workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Prospects & outreach</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">Research leads, tailor a message, review it, then send manually through the platform. This dashboard never sends messages.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"><Plus size={16}/> Add prospect</button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Prospects', value: rows.length, icon: Users },
            { label: 'Messages marked sent', value: sentCount, icon: Send },
            { label: 'Follow-ups due', value: followUps, icon: Clock3 },
            { label: 'Converted customers', value: convertedCount, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => <div key={label} className={`${card} p-4`}><div className="flex items-center justify-between text-sm text-white/55"><span>{label}</span><Icon size={17}/></div><div className="mt-3 text-2xl font-semibold">{value}</div></div>)}
        </div>

        <section className={`${card} mt-6 p-5`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h2 className="font-semibold">Platform pipeline</h2><p className="mt-1 text-xs text-white/50">Each tab filters your saved prospects by discovery platform.</p></div>
            <label className="relative w-full md:max-w-xs"><Search size={15} className="absolute left-3 top-3 text-white/40"/><input className={`${input} pl-9`} placeholder="Search name, role, relevance…" value={search} onChange={(e) => setSearch(e.target.value)}/></label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{PLATFORMS.map((item) => <button key={item} onClick={() => setPlatform(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${platform === item ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-white/65 hover:bg-white/10'}`}>{item}</button>)}</div>
          <div className="mt-5 space-y-3">
            {loading ? <p className="py-8 text-center text-sm text-white/50">Loading your prospects…</p> : null}
            {error ? <p className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{error}</p> : null}
            {!loading && visible.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 px-4 py-9 text-center"><p className="font-medium">{search ? 'No matching prospects' : 'No saved prospects in this view yet'}</p><p className="mt-1 text-sm text-white/50">Add a verified lead with its source and a platform-specific contact route.</p></div> : null}
            {visible.map((row) => <button key={row.id} onClick={() => openRow(row)} className="grid w-full gap-3 rounded-xl border border-white/10 bg-black/10 p-4 text-left transition hover:border-cyan-200/30 md:grid-cols-[1fr_auto] md:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{row.name}</span><span className="text-xs text-white/45">{row.role}</span><span className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/55">{row.platform}</span></div><p className="mt-2 line-clamp-2 text-sm text-white/55">{row.fit_reason}</p><div className="mt-3 flex flex-wrap gap-2"><StatusPill value={row.approval_status}/><StatusPill value={row.outreach_status}/>{row.affiliate_candidate && <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs text-violet-200">Affiliate candidate</span>}</div></div>
              <span className="text-xs text-cyan-200">Review lead →</span>
            </button>)}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <section className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Verified discovery</h2><p className="mt-1 text-xs text-white/50">A reviewed public lead suggestion. Add it to your private workspace only if it fits.</p></div><BadgeCheck className="text-cyan-200" size={19}/></div>
            {discovery.map((item) => <div key={item.key} className="mt-4 rounded-xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{item.name}</p><p className="text-xs text-white/50">{item.role} · {item.platform}</p></div><a href={item.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-200 hover:underline">Source <ExternalLink size={12}/></a></div>
              <p className="mt-3 text-sm leading-6 text-white/65">{item.fit_reason}</p>
              <p className="mt-2 text-xs text-white/45">Contact: {item.contact_method}. Affiliate terms or audience size are not verified.</p>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void addDiscovery(item)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15">Add to prospects</button><a href={item.contact_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/5">Open public contact <ExternalLink size={12}/></a></div>
            </div>)}
          </section>
          <section className={`${card} p-5`}>
            <h2 className="font-semibold">Affiliate guardrails</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Affiliate outreach stays separate from customer outreach. Don’t promise a commission, payout, or eligibility until the official terms are confirmed.</p>
            <a href="https://crossloop.ai/affiliates" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-cyan-200 hover:bg-white/5">Review supplied affiliate page <ExternalLink size={13}/></a>
            <div className="mt-4 rounded-xl bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">Terms currently unverified in this workspace. Record the exact official source on each affiliate lead before sending an offer.</div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/55"><span>Affiliate candidates in pipeline</span><span className="font-semibold text-white">{affiliateCount}</span></div>
          </section>
        </div>

        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add a verified prospect</h2><button onClick={() => setShowForm(false)} aria-label="Close"><X size={18}/></button></div>
            <p className="mt-1 text-xs text-white/50">Save a public profile, source, contact route, and tailored draft. Required fields: name, source, platform, fit note.</p>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); await addProspect({ ...form, approval_status: 'draft', outreach_status: 'not_sent', affiliate_status: form.affiliate_candidate ? 'terms_unverified' : 'not_applicable', affiliate_terms_verified: false, notes: '' }); }}>
              <select className={input} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>{PLATFORMS.slice(1).map((p) => <option key={p}>{p}</option>)}</select>
              <input className={input} placeholder="Name / handle *" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })}/>
              <input className={input} placeholder="Role / organization" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}/>
              <input className={input} placeholder="Profile URL" type="url" value={form.profile_url} onChange={(e) => setForm({ ...form, profile_url: e.target.value })}/>
              <input className={input} placeholder="Public source URL *" type="url" value={form.source_url} required onChange={(e) => setForm({ ...form, source_url: e.target.value })}/>
              <input className={input} placeholder="Contact method (e.g. public DM)" value={form.contact_method} onChange={(e) => setForm({ ...form, contact_method: e.target.value })}/>
              <input className={input} placeholder="Contact URL / public email link" type="url" value={form.contact_url} onChange={(e) => setForm({ ...form, contact_url: e.target.value })}/>
              <input className={input} placeholder="Audience fit / evidence" value={form.audience_relevance} onChange={(e) => setForm({ ...form, audience_relevance: e.target.value })}/>
              <textarea className={`${input} sm:col-span-2`} placeholder="Why this lead fits (evidence-backed) *" required rows={2} value={form.fit_reason} onChange={(e) => setForm({ ...form, fit_reason: e.target.value })}/>
              <input className={`${input} sm:col-span-2`} placeholder="Message subject" value={form.outreach_subject} onChange={(e) => setForm({ ...form, outreach_subject: e.target.value })}/>
              <textarea className={`${input} sm:col-span-2`} placeholder="Personalized message draft" rows={5} value={form.outreach_message} onChange={(e) => setForm({ ...form, outreach_message: e.target.value })}/>
              <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2"><input type="checkbox" checked={form.affiliate_candidate} onChange={(e) => setForm({ ...form, affiliate_candidate: e.target.checked })}/> Potential affiliate partner (terms remain unverified)</label>
              <button className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 sm:col-span-2">Save prospect</button>
            </form>
          </div>
        </div>}

        {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-cyan-200">{selected.platform} · {selected.role}</p><h2 className="mt-1 text-xl font-semibold">{selected.name}</h2></div><button onClick={() => setSelected(null)} aria-label="Close"><X size={18}/></button></div>
            <p className="mt-3 text-sm leading-6 text-white/65">{selected.fit_reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">{selected.source_url && <a className="inline-flex items-center gap-1 text-xs text-cyan-200" href={selected.source_url} target="_blank" rel="noreferrer">Evidence source <ExternalLink size={12}/></a>}{selected.profile_url && <a className="inline-flex items-center gap-1 text-xs text-cyan-200" href={selected.profile_url} target="_blank" rel="noreferrer">Profile <ExternalLink size={12}/></a>}{selected.contact_url && <a className="inline-flex items-center gap-1 text-xs text-cyan-200" href={selected.contact_url} target="_blank" rel="noreferrer">Contact route: {selected.contact_method || 'Open'} <ExternalLink size={12}/></a>}</div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-white/50">Review status<select className={`${input} mt-1`} value={selected.approval_status} onChange={(e) => void update(selected.id, { approval_status: e.target.value })}><option value="draft">Draft</option><option value="in_review">In review</option><option value="approved">Approved to send manually</option><option value="rejected">Rejected</option></select></label>
              <label className="text-xs text-white/50">Pipeline status<select className={`${input} mt-1`} value={selected.outreach_status} onChange={(e) => void update(selected.id, { outreach_status: e.target.value })}><option value="not_sent">Not sent</option><option value="replied">Replied</option><option value="follow_up">Follow-up</option><option value="not_interested">Not interested</option><option value="converted">Converted</option></select></label>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2"><MessageSquareText size={16} className="text-cyan-200"/><h3 className="text-sm font-semibold">Personalized message</h3></div>
              <input className={`${input} mt-3`} placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)}/>
              <textarea className={`${input} mt-2 leading-6`} rows={7} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Draft based on verified profile-specific context"/>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => void saveDraft()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Save size={13}/> Save draft</button>
                <button onClick={() => void copyDraft()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Copy size={13}/> Copy message</button>
                {selected.contact_url && <a href={selected.contact_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Open manual send route <ExternalLink size={13}/></a>}
              </div>
              <p className="mt-3 text-xs text-white/40">Manual send only. Copy/open does not send. Use “Mark sent” only after you send and confirm it.</p>
              <button onClick={() => void markSent()} className="mt-3 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">Confirm manually sent</button>
            </div>

            <div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-300/[.03] p-4">
              <div className="flex items-center gap-2"><CircleDollarSign size={16} className="text-violet-200"/><h3 className="text-sm font-semibold">Affiliate opportunity</h3></div>
              <p className="mt-2 text-xs leading-5 text-white/55">{selected.affiliate_candidate ? 'Flagged as a possible promoter. No commission or eligibility claims are loaded.' : 'Not currently flagged as an affiliate candidate.'}</p>
              {selected.affiliate_candidate && <div className="mt-3 flex flex-wrap items-center gap-2"><StatusPill value={selected.affiliate_status}/>{selected.affiliate_terms_verified ? <StatusPill value="terms_verified"/> : <button onClick={() => void verifyAffiliateTerms()} className="rounded-lg border border-violet-200/20 px-3 py-2 text-xs text-violet-100 hover:bg-violet-300/10">Record reviewed official terms</button>}</div>}
              {selected.affiliate_terms_verified && selected.affiliate_terms_source && <a className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200" href={selected.affiliate_terms_source} target="_blank" rel="noreferrer">Terms evidence <ExternalLink size={12}/></a>}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="text-xs text-white/50">Follow-up reminder<input className={`${input} mt-1`} type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)}/></label>
              <button onClick={() => void saveDraft()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Save size={13}/> Save follow-up</button>
              <button onClick={() => void trackConversion()} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/5"><Check size={13}/> Confirm customer conversion</button>
            </div>
          </div>
        </div>}

        {notice && <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm shadow-xl"><Check size={15} className="text-emerald-300"/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14}/></button></div>}
      </div>
    </div>
  );
}
