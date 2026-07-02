'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { MOCK_DRAFTS } from '@/lib/mock-data';
import type { ContentDraft } from '@/lib/database.types';
import { PlatformBadge, StatusBadge } from '@/components/score-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [view, setView] = useState<'month' | 'list'>('month');

  useEffect(() => {
    if (!user) return;
    loadDrafts();
  }, [user]);

  const loadDrafts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['scheduled', 'published', 'approved'])
      .order('scheduled_at', { ascending: true });
    const db = data ?? [];

    const mockScheduled = MOCK_DRAFTS.map((d, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(9 + i * 3);
      return { ...d, id: `mock-draft-${i}`, user_id: user.id, opportunity_id: null, idea_id: null, published_at: null, external_post_id: null, external_post_url: null, scheduled_at: date.toISOString(), generation_params: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    });

    setDrafts(db.length > 0 ? db : mockScheduled);
    setLoading(false);
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  const getDraftsForDay = (day: Date) =>
    drafts.filter(d => d.scheduled_at && isSameDay(new Date(d.scheduled_at), day));

  const selectedDayDrafts = selectedDay ? getDraftsForDay(selectedDay) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track and schedule your approved content.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={cn('px-3 py-1.5 rounded text-xs font-medium border transition-all', view === 'month' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border')}
          >Month</button>
          <button
            onClick={() => setView('list')}
            className={cn('px-3 py-1.5 rounded text-xs font-medium border transition-all', view === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border')}
          >List</button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map(day => {
                const dayDrafts = getDraftsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'p-1.5 rounded-lg min-h-[60px] text-left transition-all',
                      isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-secondary border border-transparent',
                      !isSameMonth(day, currentMonth) && 'opacity-30'
                    )}
                  >
                    <div className={cn(
                      'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>
                    {dayDrafts.slice(0, 2).map(draft => (
                      <div key={draft.id} className={cn(
                        'text-xs px-1 py-0.5 rounded mb-0.5 truncate',
                        draft.platform === 'linkedin' ? 'bg-sky-400/10 text-sky-400' : 'bg-zinc-400/10 text-zinc-300'
                      )}>
                        {draft.hook?.slice(0, 16) || draft.body.slice(0, 16)}...
                      </div>
                    ))}
                    {dayDrafts.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayDrafts.length - 2}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          <div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3">
                {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a day'}
              </h3>
              {selectedDayDrafts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No posts scheduled for this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayDrafts.map(draft => (
                    <Link key={draft.id} href={`/studio/${draft.id}`}>
                      <div className="p-3 rounded-lg bg-secondary border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <PlatformBadge platform={draft.platform} />
                          <StatusBadge status={draft.status} />
                        </div>
                        {draft.scheduled_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                            <Clock className="w-3 h-3" />
                            {format(new Date(draft.scheduled_at), 'h:mm a')}
                          </div>
                        )}
                        <p className="text-xs line-clamp-2">{draft.hook || draft.body.slice(0, 80)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // List view
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No scheduled posts yet.</p>
              <Link href="/queue"><Button className="mt-4">Go to Queue</Button></Link>
            </div>
          ) : (
            drafts.map(draft => (
              <Link key={draft.id} href={`/studio/${draft.id}`}>
                <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    {draft.scheduled_at ? (
                      <>
                        <div className="text-xs font-mono text-muted-foreground">{format(new Date(draft.scheduled_at), 'MMM d')}</div>
                        <div className="text-sm font-semibold">{format(new Date(draft.scheduled_at), 'h:mm a')}</div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">Unscheduled</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <PlatformBadge platform={draft.platform} />
                      <StatusBadge status={draft.status} />
                    </div>
                    <p className="text-sm truncate">{draft.hook || draft.body.slice(0, 80)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
