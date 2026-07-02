import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await req.json();
  const { scheduledAt, mode = 'manual' } = body;

  if (!scheduledAt) {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'scheduledAt is required' } }, { status: 400 });
  }

  const { data: draft } = await supabase
    .from('content_drafts')
    .select('platform, status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!draft) return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

  const { error } = await supabase
    .from('content_drafts')
    .update({ status: 'scheduled', scheduled_at: scheduledAt })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });

  await supabase.from('publish_jobs').insert({
    user_id: user.id,
    draft_id: params.id,
    platform: draft.platform,
    mode: 'manual',
    scheduled_at: scheduledAt,
    status: 'manual_ready',
  });

  return NextResponse.json({ ok: true, mode: 'manual', setupRequired: mode === 'automatic' });
}
