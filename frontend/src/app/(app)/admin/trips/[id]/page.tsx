'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, UsersRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Trip, User } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AdminTripDetail = Trip & {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
};

export default function AdminTripDetailPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<AdminTripDetail | null>(null);

  useEffect(() => {
    api.get(`/admin/trips/${params.id}`).then(({ data }) => setTrip(data));
  }, [params.id]);

  const actualExpenses = useMemo(() => trip?.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0, [trip]);
  const estimated = Number(trip?.budget?.totalEstimatedCost || 0);
  const totalBudget = Number(trip?.totalBudget || 0);
  const status = estimated > totalBudget || actualExpenses > totalBudget ? 'Over budget' : 'Within budget';

  if (!trip) return <div className="text-muted-foreground">Loading trip detail...</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/trips" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to all trips
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{trip.title}</h1>
            <p className="mt-1 text-muted-foreground">{trip.summary || trip.destination}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${status === 'Over budget' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Owner</p><p className="text-lg font-semibold">{trip.user.email}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Destination</p><p className="text-2xl font-semibold">{trip.destination}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Travelers</p><p className="flex items-center gap-2 text-2xl font-semibold"><UsersRound className="h-5 w-5" />{trip.numberOfPeople}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Date</p><p className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5" />{dateOnly(trip.startDate)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-3xl font-semibold">{money(trip.totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Estimated</p><p className="text-3xl font-semibold">{money(estimated)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Actual</p><p className="text-3xl font-semibold">{money(actualExpenses)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {trip.days.map((day) => (
              <div key={day.id} className="rounded-2xl border bg-white/70 p-4">
                <p className="font-semibold">Day {day.dayNumber} · {dateOnly(day.date)}</p>
                <div className="mt-3 space-y-3">
                  {day.activities.map((activity) => (
                    <div key={activity.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[80px_1fr_120px]">
                      <span className="font-mono text-sm">{activity.time}</span>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.location} · {activity.category}</p>
                      </div>
                      <p className="font-semibold">{money(activity.estimatedCost)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trip.expenses.map((expense) => (
              <div key={expense.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-white/70 p-4">
                <div>
                  <p className="font-semibold">{expense.title}</p>
                  <p className="text-sm text-muted-foreground">{expense.category} · {dateOnly(expense.expenseDate)}</p>
                </div>
                <p className="font-semibold">{money(expense.amount)}</p>
              </div>
            ))}
            {!trip.expenses.length && <p className="text-sm text-muted-foreground">No expenses recorded.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
