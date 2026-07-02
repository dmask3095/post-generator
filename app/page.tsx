import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ArrowRight, Radio, SquarePen as PenSquare, ChartBar as BarChart3, SquareCheck as CheckSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 px-6 h-14 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight">SignalScript</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <Badge variant="secondary" className="mb-6 text-primary border-primary/20 bg-primary/10">
          AI Personal Brand Operating System
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Write what matters.
          <br />
          <span className="gradient-text">Sound like yourself.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          SignalScript researches daily trends, finds differentiated angles, and writes LinkedIn and X posts in your authentic voice — not generic AI noise.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start building your brand
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Radio,
              title: 'Daily Intelligence',
              desc: 'Trend clusters, content opportunities, and scored angles — researched every day from curated sources.',
            },
            {
              icon: PenSquare,
              title: 'Content Studio',
              desc: 'Generate 2 LinkedIn + 2 X posts daily. Edit with one-click controls: sharper, contrarian, shorter, more personal.',
            },
            {
              icon: CheckSquare,
              title: 'Approval Queue',
              desc: 'Review, approve, edit, schedule, and duplicate drafts. Every post goes through you before it goes live.',
            },
            {
              icon: BarChart3,
              title: 'Learning System',
              desc: 'Track what performs. Get weekly recommendations that improve your next week\'s content.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-6 text-center text-sm text-muted-foreground">
        <p>SignalScript — Write what matters. Sound like yourself.</p>
      </footer>
    </div>
  );
}
