import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

interface VisualConcept {
  imageUrl: string | null;
  imagePrompt: string;
  concept: string;
  style: string;
  alternativeIdeas: { description: string; style: string }[];
  captionSuggestion: string;
}

const MOCK_VISUAL_CONCEPTS: Record<string, VisualConcept> = {
  linkedin: {
    imageUrl: null,
    imagePrompt: 'Minimalist infographic showing AI workflow automation, clean dark background, electric blue accents, geometric shapes representing processes connecting seamlessly',
    concept: 'Abstract visualization of workflow automation — interconnected nodes flowing smoothly into each other, representing AI eliminating friction',
    style: 'Minimalist tech infographic, dark background, electric blue and white accents, no text overlays',
    alternativeIdeas: [
      { description: 'Split-screen: cluttered manual workflow vs. clean automated one', style: 'Clean flat design, muted tones, strong visual contrast' },
      { description: 'A single glowing thread connecting scattered dots — metaphor for integration', style: 'Dark gradient, neon accent lines, editorial photography style' },
      { description: 'Close-up of hands away from keyboard while output generates itself', style: 'Documentary photography, natural light, authentic feel' },
    ],
    captionSuggestion: 'The quietest AI wins. Save this for when you need to explain why "less visible" = more powerful.',
  },
  x: {
    imageUrl: null,
    imagePrompt: 'Bold typographic card with sharp contrarian statement, dark background, white text, single accent color, social media optimized 1:1 ratio',
    concept: 'High-contrast typographic card — the post\'s sharpest line as a visual statement',
    style: 'Bold typography, dark background, one accent color, no clutter',
    alternativeIdeas: [
      { description: 'Chart/graph that makes the point visually without needing text', style: 'Minimal data visualization, high contrast' },
      { description: 'Meme format — familiar template with fresh take', style: 'Internet-native, relatable, sharp punchline placement' },
    ],
    captionSuggestion: 'Pair with the hook. The visual stops the scroll; the text makes them stay.',
  },
};

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();
  const { postBody, platform, hook, draftId } = body as {
    postBody: string;
    platform: 'linkedin' | 'x';
    hook?: string;
    draftId?: string;
  };

  if (!postBody || !platform) {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'postBody and platform are required' } }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: true, ...MOCK_VISUAL_CONCEPTS[platform] });
  }

  try {
    // Step 1: Generate visual concept + DALL-E prompt via GPT
    const conceptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_GENERATION_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a visual director for a professional personal brand on ${platform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)'}.
You create visual content strategies that maximize engagement.
Return ONLY valid JSON with:
- imagePrompt: A detailed DALL-E 3 prompt for a ${platform === 'linkedin' ? '16:9 landscape' : '1:1 square'} image. No text in image. Professional, visually striking, dark or neutral background preferred.
- concept: 1-sentence description of what the visual shows and why it works for this post.
- style: The visual aesthetic in 5-8 words (e.g. "minimalist dark tech, electric blue accents").
- alternativeIdeas: Array of 2-3 objects each with "description" and "style" for other visual options.
- captionSuggestion: 1-sentence note on how to use this visual with the post for max engagement.`,
          },
          {
            role: 'user',
            content: `Post for ${platform === 'linkedin' ? 'LinkedIn' : 'X'}:
Hook: ${hook || ''}
Body: ${postBody.slice(0, 400)}

Generate a visual concept and DALL-E prompt that will stop the scroll and amplify this message.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const conceptData = await conceptRes.json();
    const concept = JSON.parse(conceptData.choices[0].message.content);

    // Step 2: Generate actual image with DALL-E 3
    let imageUrl: string | null = null;
    try {
      const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: concept.imagePrompt,
          n: 1,
          size: platform === 'linkedin' ? '1792x1024' : '1024x1024',
          quality: 'standard',
          style: 'vivid',
        }),
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        imageUrl = imageData.data?.[0]?.url ?? null;
      }
    } catch {
      // Image generation failed, return concept without image
    }

    return NextResponse.json({
      ok: true,
      imageUrl,
      imagePrompt: concept.imagePrompt,
      concept: concept.concept,
      style: concept.style,
      alternativeIdeas: concept.alternativeIdeas ?? [],
      captionSuggestion: concept.captionSuggestion,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: true, ...MOCK_VISUAL_CONCEPTS[platform] });
  }
}
