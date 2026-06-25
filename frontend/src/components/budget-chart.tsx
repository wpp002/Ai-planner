'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Budget, Expense } from '@/lib/types';

export function BudgetChart({ budget, expenses = [] }: { budget?: Budget | null; expenses?: Expense[] }) {
  const categories = ['accommodation', 'food', 'transportation', 'activities', 'shopping', 'emergency'];
  const data = categories.map((category) => ({
    category,
    estimated: Number(budget?.[category as keyof Budget] || 0),
    actual: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount), 0)
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="estimated" fill="#2f8f83" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" fill="#d97706" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
