import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { WEEKLY_LEARNING_REPORT } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const metricsRes = await supabase
    .from('post_metrics')
    .select('*, content_drafts!inner(platform, post_type, hook, brand_fit_score, overall_score)')
    .eq('user_id', user.id)
    .gte('metric_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);

  const metrics = metricsRes.data ?? [];

  let reportData = WEEKLY_LEARNING_REPORT;

  if (metrics.length > 0 && process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_GENERATION_MODEL || 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'Analyze content performance and return JSON with: summary, what_worked (array), what_failed (array), recommendations (array), learned_patterns (object).',
          }, {
            role: 'user',
            content: `Analyze these metrics for Sejal's content: ${JSON.stringify(metrics.slice(0, 10))}`,
          }],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reportData = JSON.parse(data.choices[0].message.content);
      }
    } catch {}
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const { error } = await supabase.from('learning_reports').insert({
    user_id: user.id,
    report_type: 'weekly',
    period_start: weekAgo.toISOString().split('T')[0],
    period_end: now.toISOString().split('T')[0],
    summary: reportData.summary,
    what_worked: reportData.what_worked,
    what_failed: reportData.what_failed,
    recommendations: reportData.recommendations,
    learned_patterns: {},
  });

  if (error) return NextResponse.json({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });

  return NextResponse.json({ ok: true, report: reportData });
}
