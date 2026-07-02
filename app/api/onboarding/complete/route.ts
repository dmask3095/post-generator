import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { DEFAULT_BRAND_PROFILE } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();

  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: body.displayName || user.email,
      onboarding_completed: true,
    }, { onConflict: 'id' });

    const existing = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (existing.data) {
      await supabase.from('brand_profiles').update({
        positioning: body.positioning ?? DEFAULT_BRAND_PROFILE.positioning,
        audiences: body.audiences ?? DEFAULT_BRAND_PROFILE.audiences,
        topics: body.topics ?? DEFAULT_BRAND_PROFILE.topics,
        tone_descriptors: body.toneDescriptors ?? DEFAULT_BRAND_PROFILE.tone_descriptors,
        banned_phrases: DEFAULT_BRAND_PROFILE.banned_phrases,
        preferred_formats: DEFAULT_BRAND_PROFILE.preferred_formats,
        daily_linkedin_target: body.dailyLinkedinTarget ?? 2,
        daily_x_target: body.dailyXTarget ?? 2,
      }).eq('user_id', user.id);
    } else {
      await supabase.from('brand_profiles').insert({
        user_id: user.id,
        positioning: body.positioning ?? DEFAULT_BRAND_PROFILE.positioning,
        audiences: body.audiences ?? DEFAULT_BRAND_PROFILE.audiences,
        topics: body.topics ?? DEFAULT_BRAND_PROFILE.topics,
        tone_descriptors: body.toneDescriptors ?? DEFAULT_BRAND_PROFILE.tone_descriptors,
        style_rules: {},
        banned_phrases: DEFAULT_BRAND_PROFILE.banned_phrases,
        preferred_formats: DEFAULT_BRAND_PROFILE.preferred_formats,
        daily_linkedin_target: body.dailyLinkedinTarget ?? 2,
        daily_x_target: body.dailyXTarget ?? 2,
      });
    }

    await supabase.from('app_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' });
    await supabase.from('email_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id' });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL', message: err.message } }, { status: 500 });
  }
}
