import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { MOCK_OPPORTUNITIES, MOCK_TREND_CLUSTERS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const [oppsRes, clustersRes] = await Promise.all([
    supabase.from('content_opportunities').select('*').eq('user_id', user.id).in('status', ['new', 'saved']).order('overall_score', { ascending: false }).limit(10),
    supabase.from('trend_clusters').select('*').eq('user_id', user.id).order('momentum_score', { ascending: false }).limit(6),
  ]);

  const opportunities = oppsRes.data?.length ? oppsRes.data : MOCK_OPPORTUNITIES.map((o, i) => ({
    ...o,
    id: `mock-${i}`,
    user_id: user.id,
    cluster_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const clusters = clustersRes.data?.length ? clustersRes.data : MOCK_TREND_CLUSTERS.map((c, i) => ({
    ...c,
    id: `mock-cluster-${i}`,
    user_id: user.id,
    created_at: new Date().toISOString(),
  }));

  return NextResponse.json({ ok: true, opportunities, clusters });
}
