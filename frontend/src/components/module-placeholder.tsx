import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export function ModulePlaceholder({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Workspace module</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr_320px] md:items-center">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold">Designed for the next product milestone</h2>
            <p className="mt-3 text-muted-foreground">
              This module is wired into the production navigation and ready for deeper workflows without disrupting the core trip planning experience.
            </p>
            <Button className="mt-6">Explore core trips</Button>
          </div>
          <div className="rounded-2xl border bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Coming intelligence</p>
            <div className="mt-5 space-y-3">
              {['Smart filters', 'AI summaries', 'Exportable insights'].map((item) => (
                <div key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
