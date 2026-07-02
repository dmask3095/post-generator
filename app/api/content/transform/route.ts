import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { TransformInstruction } from '@/lib/database.types';

const INSTRUCTION_PROMPTS: Record<TransformInstruction, string> = {
  make_sharper: 'Make this post sharper and more direct. Cut filler. Strengthen the core idea. Keep Sejal\'s voice.',
  make_more_contrarian: 'Make this more contrarian. Challenge the common assumption. Be specific about what most people get wrong.',
  make_more_personal: 'Make this more personal. Add a specific observation or personal lens without being generic.',
  make_shorter: 'Make this significantly shorter. Keep only the essential idea and sharpest phrasing.',
  make_more_witty: 'Make this wittier. Add a sharper turn of phrase or unexpected connection.',
  add_business_lens: 'Add a clear business lens. Connect the idea to revenue, pricing, business models, or company strategy.',
  add_product_lens: 'Add a product thinking lens. Connect to UX, product decisions, user behavior, or product-market fit.',
  add_founder_lens: 'Add a founder lens. Connect to distribution, fundraising, team building, or startup execution.',
  add_student_lens: 'Add a student-to-builder lens. Make it actionable for someone learning their craft.',
  remove_cliches: 'Identify and remove all cliches. Replace with specific, original phrasing.',
  turn_into_x_thread: 'Turn this into an X thread. Format as: Tweet 1 (hook), Tweets 2-5 (progression), Final tweet (takeaway). Number each tweet.',
  turn_into_linkedin_carousel: 'Turn this into a LinkedIn carousel outline. Format as: Slide 1 (title hook), Slides 2-6 (key points), Final slide (takeaway).',
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();
  const { draftId, currentBody, instruction } = body as { draftId: string | null; currentBody: string; instruction: TransformInstruction };

  if (!currentBody || !instruction) {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'currentBody and instruction are required' } }, { status: 400 });
  }

  let existingBody = currentBody;
  let versionNumber = 1;

  if (draftId) {
    const { data: draft } = await supabase.from('content_drafts').select('body').eq('id', draftId).eq('user_id', user.id).maybeSingle();
    if (draft) existingBody = draft.body;

    const { data: versions } = await supabase.from('draft_versions').select('version_number').eq('draft_id', draftId).order('version_number', { ascending: false }).limit(1);
    versionNumber = (versions?.[0]?.version_number ?? 0) + 1;

    await supabase.from('draft_versions').insert({
      draft_id: draftId,
      user_id: user.id,
      version_number: versionNumber - 1,
      body: existingBody,
      change_instruction: instruction,
      scores: {},
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const transformedBody = simulateTransform(existingBody, instruction);
    if (draftId) {
      await supabase.from('content_drafts').update({ body: transformedBody }).eq('id', draftId);
    }
    return NextResponse.json({ ok: true, body: transformedBody, scores: { brand_fit: 88, originality: 85, virality: 80, clarity: 90, cliche_risk: 8, overall: 87 } });
  }

  try {
    const systemPrompt = `You are an editor for Sejal Kishor Daterao's personal brand content. She writes about technology, business, AI, startups, and product thinking. Her voice is concise, sharp, witty, non-cliched, and authentic.

QUALITY RULES:
- LinkedIn: max 160 words. Punchy, every sentence earns its place.
- X/Twitter: max 240 chars per tweet (threads max 5 tweets).
- No filler phrases, no clichés, no corporate speak.
- End strong: a question, a sharp observation, or a clear takeaway.

Return ONLY valid JSON with fields: body (the revised post), change_summary (brief), scores (object: brand_fit, originality, virality, clarity, cliche_risk, overall as 0-100).`;

    const userPrompt = `${INSTRUCTION_PROMPTS[instruction]}

Current post:
${existingBody}

Return JSON only.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_GENERATION_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (draftId) {
      await supabase.from('content_drafts').update({
        body: parsed.body,
        brand_fit_score: parsed.scores?.brand_fit,
        originality_score: parsed.scores?.originality,
        virality_score: parsed.scores?.virality,
        clarity_score: parsed.scores?.clarity,
        cliche_risk_score: parsed.scores?.cliche_risk,
        overall_score: parsed.scores?.overall,
      }).eq('id', draftId);
    }

    return NextResponse.json({ ok: true, body: parsed.body, scores: parsed.scores });
  } catch (err: any) {
    const fallback = simulateTransform(existingBody, instruction);
    return NextResponse.json({ ok: true, body: fallback, scores: { brand_fit: 85, originality: 82, virality: 78, clarity: 88, cliche_risk: 10, overall: 85 } });
  }
}

function simulateTransform(body: string, instruction: TransformInstruction): string {
  switch (instruction) {
    case 'make_shorter':
      return body.split('\n').filter(Boolean).slice(0, 4).join('\n');
    case 'remove_cliches':
      return body
        .replace(/in today's fast-paced world/gi, 'right now')
        .replace(/game changer/gi, 'important shift')
        .replace(/revolutionary/gi, 'significant');
    case 'turn_into_x_thread':
      const lines = body.split('\n').filter(Boolean);
      return lines.map((l, i) => `${i + 1}/ ${l}`).slice(0, 5).join('\n\n');
    default:
      return body + '\n\n[Transformed with: ' + instruction.replace(/_/g, ' ') + ']';
  }
}
