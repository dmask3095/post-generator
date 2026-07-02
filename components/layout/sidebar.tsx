'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { Zap, LayoutDashboard, Radio, SquarePen as PenSquare, SquareCheck as CheckSquare, Calendar, ChartBar as BarChart3, Settings, Lightbulb, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/intelligence', label: 'Intelligence', icon: Radio },
  { href: '/studio', label: 'Studio', icon: PenSquare },
  { href: '/queue', label: 'Queue', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 flex flex-col bg-card border-r border-border z-30">
      <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight">SignalScript</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 sidebar-scroll">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all',
            pathname.startsWith('/settings')
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </Link>

        <div className="px-3 py-2 flex items-center gap-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
