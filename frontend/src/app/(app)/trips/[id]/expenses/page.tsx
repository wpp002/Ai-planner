'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Trip } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function ExpensesPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState({ title: '', amount: 0, category: 'food', note: '', expenseDate: new Date().toISOString().slice(0, 10) });

  async function load() {
    const { data } = await api.get(`/trips/${id}`);
    setTrip(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api.post('/expenses', { ...form, tripId: id });
    setForm({ ...form, title: '', amount: 0, note: '' });
    await load();
  }

  async function remove(expenseId: string) {
    await api.delete(`/expenses/${expenseId}`);
    await load();
  }

  async function edit(expenseId: string, title: string, amount: number) {
    const nextTitle = window.prompt('Expense title', title);
    if (!nextTitle) return;
    const nextAmount = Number(window.prompt('Expense amount', String(amount)) || amount);
    await api.patch(`/expenses/${expenseId}`, { title: nextTitle, amount: nextAmount });
    await load();
  }

  if (!trip) return <div className="text-sm text-muted-foreground">Loading expenses...</div>;
  const total = trip.expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add Actual Expense</CardTitle>
          <p className="text-sm text-muted-foreground">Spent: {money(total)} / {money(trip.totalBudget)}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="accommodation">Accommodation</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
                <option value="activities">Activities</option>
                <option value="shopping">Shopping</option>
                <option value="emergency">Emergency</option>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Note</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            <Button className="w-full">Save Expense</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Actual Expenses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {trip.expenses.map((expense) => (
            <div key={expense.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_130px_auto]">
              <div>
                <p className="font-medium">{expense.title}</p>
                <p className="text-sm text-muted-foreground">{expense.category} | {dateOnly(expense.expenseDate)}</p>
                {expense.note && <p className="mt-1 text-sm">{expense.note}</p>}
              </div>
              <p className="font-semibold">{money(expense.amount)}</p>
              <div className="flex gap-1">
                <Button variant="ghost" title="Edit expense" onClick={() => edit(expense.id, expense.title, Number(expense.amount))}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" title="Delete expense" onClick={() => remove(expense.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
