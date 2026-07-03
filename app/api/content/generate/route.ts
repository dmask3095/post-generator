import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { generateJSON } from '@/lib/gemini';
import { MOCK_DRAFTS } from '@/lib/mock-data';
import type { ContentOpportunity, Database } from '@/lib/database.types';

type DraftInsert = Database['public']['Tables']['content_drafts']['Insert'];

const BANNED_PHRASES = [
  "in today's fast-paced world",
  'game changer',
  'revolutionary',
  'unlock your potential',
  "here's why",
  'i am thrilled to announce',
  'super excited',
  'this changes everything',
  'in the age of ai',
  'disruptive innovation',
  'leverage ai',
];

function containsBannedPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

async function generateWithGemini(opportunity: ContentOpportunity, platform: string, postType: string, brandContext: string): Promise<typeof MOCK_DRAFTS[0] | null> {
  const systemPrompt = `You are writing for Sejal Kishor Daterao — a product thinker, tech-business analyst, and student founder.
${brandContext}

VOICE: Concise, sharp, direct, witty when earned — never forced. Sounds like a smart person thinking aloud, not a thought leader performing.

POST QUALITY RULES (strictly enforced):
- LinkedIn: 80-160 words MAXIMUM. Every sentence must earn its place. No filler, no throat-clearing.
- X/Twitter: Under 240 characters unless it is a thread. Threads: max 5 tweets, each under 260 chars.
- Hook MUST stop the scroll in under 10 words. No "In today's world" openers.
- Body: one strong idea, developed in 3-5 tight sentences max for LinkedIn. For X: one sharp insight.
- Hashtags: LinkedIn max 3, X max 2. Only include if they genuinely add reach.
- End with either a question that prompts engagement, or a clear takeaway line. Never a CTA like "Follow for more."

BANNED PHRASES (automatic fail): in today's fast-paced world, game changer, revolutionary, unlock your potential, here's why, super excited, this changes everything, disruptive innovation, leverage ai, it's more than just, the future is, wake-up call, paradigm shift.

Return ONLY valid JSON with: hook (string), body (string), hashtags (array), rationale (1 sentence why this will perform), scores (brand_fit, originality, virality, clarity, cliche_risk, overall as 0-100 numbers).`;

  const userPrompt = `Write a ${postType} post for ${platform === 'linkedin' ? 'LinkedIn' : 'X'} based on this opportunity:

Title: ${opportunity.title}
Summary: ${opportunity.summary}
Why it matters: ${opportunity.why_it_matters}
Differentiated angle: ${opportunity.differentiated_angle}

${platform === 'linkedin'
    ? 'LinkedIn post: 80-160 words. Punchy hook (under 10 words). 3-5 tight body sentences. End with a question or a sharp takeaway. 2-3 hashtags max.'
    : 'X post: under 240 characters OR a thread of max 5 tweets. Sharp, one clear idea. No hashtag padding.'}

Return JSON only.`;

  const parsed = await generateJSON<{ hook: string; body: string; hashtags?: string[]; rationale: string; scores?: Record<string, number> }>(systemPrompt, userPrompt, { temperature: 0.8 });
  if (!parsed) return null;
  if (containsBannedPhrase(parsed.body)) return null;
  return { platform: platform as 'linkedin' | 'x', post_type: postType, title: null as string | null, hook: parsed.hook, body: parsed.body, hashtags: parsed.hashtags ?? [], emojis: [], rationale: parsed.rationale, status: 'draft' as const, brand_fit_score: parsed.scores?.brand_fit ?? 80, originality_score: parsed.scores?.originality ?? 80, virality_score: parsed.scores?.virality ?? 75, clarity_score: parsed.scores?.clarity ?? 85, cliche_risk_score: parsed.scores?.cliche_risk ?? 10, overall_score: parsed.scores?.overall ?? 80 };
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();
  const { opportunityId, opportunityData, platforms = ['linkedin', 'x'], counts = { linkedin: 2, x: 2 } } = body;

  let opportunity: ContentOpportunity | null = null;
  if (opportunityId) {
    const { data } = await supabase.from('content_opportunities').select('*').eq('id', opportunityId).eq('user_id', user.id).maybeSingle();
    opportunity = data;
  }
  if (!opportunity && opportunityData) opportunity = opportunityData;

  const brandRes = await supabase.from('brand_profiles').select('*').eq('user_id', user.id).maybeSingle();
  const brand = brandRes.data;
  const brandContext = brand ? `She positions herself as: ${brand.positioning.join(', ')}. Her audience: ${brand.audiences.join(', ')}. Topics: ${brand.topics.join(', ')}. Tone: ${brand.tone_descriptors.join(', ')}.` : 'Product thinker and tech-business analyst with authentic, concise voice.';

  const draftsToInsert: DraftInsert[] = [];

  const postTypes: Record<string, string[]> = {
    linkedin: ['trend_breakdown', 'business_implication'],
    x: ['short_sharp_take', 'contrarian_take'],
  };

  for (const platform of platforms) {
    const count = counts[platform] ?? 2;
    const types = postTypes[platform] ?? ['short_sharp_take'];

    for (let i = 0; i < count; i++) {
      const postType = types[i % types.length];
      let draft = opportunity ? await generateWithGemini(opportunity as ContentOpportunity, platform, postType, brandContext) : null;

      if (!draft) {
        const mockIdx = (platform === 'linkedin' ? 0 : 1) + i * 2;
        const mockDraft = MOCK_DRAFTS[mockIdx % MOCK_DRAFTS.length];
        draft = { ...mockDraft, platform: platform as 'linkedin' | 'x', post_type: postType };
      }

      draftsToInsert.push({
        ...draft,
        user_id: user.id,
        opportunity_id: opportunityId && !opportunityId.startsWith('mock-') ? opportunityId : null,
        idea_id: null,
        published_at: null,
        external_post_id: null,
        external_post_url: null,
        scheduled_at: null,
        generation_params: { postType, platform, opportunityTitle: opportunity?.title },
      } as DraftInsert);
    }
  }

  const { data: inserted, error } = await supabase.from('content_drafts').insert(draftsToInsert).select();
  if (error) return NextResponse.json({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });

  if (opportunityId && !opportunityId.startsWith('mock-')) {
    await supabase.from('content_opportunities').update({ status: 'used' }).eq('id', opportunityId);
  }

  return NextResponse.json({ ok: true, drafts: inserted });
}
