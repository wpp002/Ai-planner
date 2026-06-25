'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Trip } from '@/lib/types';
import { money } from '@/lib/utils';
import { BudgetChart } from '@/components/budget-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fields = ['accommodation', 'food', 'transportation', 'activities', 'shopping', 'emergency'] as const;

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tips, setTips] = useState<Array<{ title: string; detail: string; estimatedSaving: number; category: string }>>([]);

  async function load() {
    const { data } = await api.get(`/trips/${id}`);
    setTrip(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const actual = useMemo(() => trip?.expenses.reduce((sum, item) => sum + Number(item.amount), 0) || 0, [trip]);
  if (!trip) return <div className="text-sm text-muted-foreground">Loading budget...</div>;
  const remaining = Number(trip.totalBudget) - actual;

  async function saveBudget() {
    if (!trip?.budget) return;
    await api.patch(`/budgets/${trip.budget.id}`, trip.budget);
    await load();
  }

  async function optimize() {
    if (!trip) return;
    const { data } = await api.post('/ai-planner/optimize-budget', {
      tripId: trip.id,
      totalBudget: Number(trip.totalBudget),
      totalEstimatedCost: Number(trip.budget?.totalEstimatedCost || 0),
      budgetBreakdown: trip.budget
    });
    setTips(data.recommendations || []);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Budget</h1>
        <p className="text-muted-foreground">{trip.title}</p>
      </div>
      {remaining < 0 && <div className="rounded-md border border-destructive bg-red-50 p-4 text-sm text-destructive">Warning: ค่าใช้จ่ายจริงเกินงบ {money(Math.abs(remaining))}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-2xl font-bold">{money(trip.totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Actual Expenses</p><p className="text-2xl font-bold">{money(actual)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Remaining</p><p className={remaining < 0 ? 'text-2xl font-bold text-destructive' : 'text-2xl font-bold text-primary'}>{money(remaining)}</p></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader><CardTitle>Budget Chart</CardTitle></CardHeader>
          <CardContent><BudgetChart budget={trip.budget} expenses={trip.expenses} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Budget by Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label className="capitalize">{field}</Label>
                <Input
                  type="number"
                  value={Number(trip.budget?.[field] || 0)}
                  onChange={(e) => setTrip({ ...trip, budget: { ...trip.budget!, [field]: Number(e.target.value) } })}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={saveBudget}>Save Budget</Button>
              <Button variant="outline" onClick={optimize}><Sparkles className="h-4 w-4" /> Optimize</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {tips.length > 0 && (
        <Card>
          <CardHeader><CardTitle>AI Budget Optimizer</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {tips.map((tip) => (
              <div key={`${tip.title}-${tip.category}`} className="rounded-md border p-3">
                <p className="font-medium">{tip.title}</p>
                <p className="text-sm text-muted-foreground">{tip.detail}</p>
                <p className="mt-2 text-sm font-medium text-primary">Save {money(tip.estimatedSaving)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
