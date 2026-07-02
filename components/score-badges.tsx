'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ScoreBadgeProps {
  label: string;
  value: number;
  invert?: boolean;
  className?: string;
}

function getScoreClass(value: number, invert = false) {
  const effective = invert ? 100 - value : value;
  if (effective >= 85) return 'score-high';
  if (effective >= 65) return 'score-mid';
  return 'score-low';
}

export function ScoreBadge({ label, value, invert = false, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        getScoreClass(value, invert),
        className
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}

interface ScoreBandProps {
  brand_fit: number;
  originality: number;
  virality: number;
  clarity: number;
  cliche_risk: number;
  overall: number;
}

export function ScoreBand({ brand_fit, originality, virality, clarity, cliche_risk, overall }: ScoreBandProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ScoreBadge label="Brand" value={brand_fit} />
      <ScoreBadge label="Original" value={originality} />
      <ScoreBadge label="Viral" value={virality} />
      <ScoreBadge label="Clarity" value={clarity} />
      <ScoreBadge label="Cliché" value={cliche_risk} invert />
      <ScoreBadge label="Overall" value={overall} />
    </div>
  );
}

export function PlatformBadge({ platform }: { platform: 'linkedin' | 'x' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      platform === 'linkedin' ? 'platform-linkedin' : 'platform-x'
    )}>
      {platform === 'linkedin' ? 'LinkedIn' : 'X'}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    needs_review: 'Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    rejected: 'Rejected',
    archived: 'Archived',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      `status-${status}`
    )}>
      {labels[status] ?? status}
    </span>
  );
}
