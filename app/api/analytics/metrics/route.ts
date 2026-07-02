import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();
  const { draftId, platform, impressions = 0, likes = 0, comments = 0, shares = 0, saves = 0, clicks = 0, profile_visits = 0, followers_gained = 0, engagement_rate = 0 } = body;

  if (!draftId || !platform) {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'draftId and platform are required' } }, { status: 400 });
  }

  const existing = await supabase.from('post_metrics').select('id').eq('draft_id', draftId).eq('user_id', user.id).maybeSingle();

  if (existing.data) {
    const { error } = await supabase.from('post_metrics').update({
      impressions, likes, comments, shares, saves, clicks, profile_visits, followers_gained, engagement_rate,
    }).eq('id', existing.data.id);
    if (error) return NextResponse.json({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  } else {
    const { error } = await supabase.from('post_metrics').insert({
      user_id: user.id,
      draft_id: draftId,
      platform,
      impressions, likes, comments, shares, saves, clicks, profile_visits, followers_gained, engagement_rate,
    });
    if (error) return NextResponse.json({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
