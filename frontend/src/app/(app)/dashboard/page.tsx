'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Lightbulb, Plane, Plus, Sparkles, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { DiscoveryResponse, Trip } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { BudgetChart } from '@/components/budget-chart';
import { DiscoverySection } from '@/components/discovery-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);

  useEffect(() => {
    api.get('/trips').then(({ data }) => setTrips(data));
  }, []);

  const activeTrip = trips[0];

  useEffect(() => {
    api.post('/ai-planner/discover', {
      destination: activeTrip?.destination || 'Bangkok',
      startDate: activeTrip?.startDate,
      numberOfPeople: activeTrip?.numberOfPeople || 2,
      totalBudget: activeTrip?.totalBudget || 15000,
      travelStyle: activeTrip?.travelStyle || 'Foodie, Cafe Hopping, Shopping'
    }).then(({ data }) => setDiscovery(data)).catch(() => setDiscovery(null));
  }, [activeTrip?.id]);

  const totals = useMemo(() => {
    const actual = trips.reduce((sum, trip) => sum + trip.expenses.reduce((s, item) => s + Number(item.amount), 0), 0);
    const estimated = trips.reduce((sum, trip) => sum + Number(trip.budget?.totalEstimatedCost || 0), 0);
    const budget = trips.reduce((sum, trip) => sum + Number(trip.totalBudget || 0), 0);
    return { actual, estimated, budget };
  }, [trips]);

  const trendData = trips.slice(0, 6).reverse().map((trip) => ({
    name: trip.destination,
    budget: Number(trip.totalBudget || 0),
    spent: trip.expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  }));
  const upcomingTrips = trips.filter((trip) => new Date(trip.startDate).getTime() >= Date.now()).slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="premium-card overflow-hidden p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{t.dashboardEyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{t.dashboardTitle}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">{t.dashboardSubtitle}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border bg-slate-950 p-5 text-white shadow-xl">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <p className="text-lg font-semibold">{t.aiRecommendation}</p>
            <p className="text-sm text-slate-300">{t.aiRecommendationText}</p>
            <Link href="/trips/create">
              <Button className="mt-2 w-full"><Plus className="h-4 w-4" /> {t.createTrip}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: t.totalTrips, value: trips.length, icon: Plane },
          { label: t.budgetUsage, value: totals.budget ? `${Math.round((totals.actual / totals.budget) * 100)}%` : '0%', icon: WalletCards },
          { label: t.savedPlaces, value: trips.reduce((sum, trip) => sum + trip.days.reduce((s, day) => s + day.activities.length, 0), 0), icon: CalendarDays },
          { label: t.aiRecommendations, value: activeTrip ? 'Ready' : 'Start', icon: Lightbulb }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {discovery && (
        <div className="space-y-8">
          <DiscoverySection title="Trending Right Now" subtitle={language === 'th' ? 'สถานที่ยอดนิยม คาเฟ่ ตลาดกลางคืน และย่านฮิตที่เหมาะกับสไตล์ของคุณ' : 'Attractions, cafes, night markets, and districts that match your travel style.'} places={discovery.trendingRightNow} />
          <DiscoverySection title="Recommended For You" subtitle={language === 'th' ? 'คำแนะนำส่วนตัวจากปลายทาง งบ และสไตล์การเที่ยว' : 'Personalized picks based on destination, budget, and style.'} places={discovery.recommendedForYou} />
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.expenseTrends}</CardTitle>
            <p className="text-sm text-muted-foreground">{t.expenseTrendsDesc}</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area dataKey="budget" stroke="#6366f1" fill="#6366f133" strokeWidth={2} />
                  <Area dataKey="spent" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.budgetBreakdown}</CardTitle>
            <p className="text-sm text-muted-foreground">{activeTrip ? activeTrip.title : t.noTrips}</p>
          </CardHeader>
          <CardContent>
            <BudgetChart budget={activeTrip?.budget} expenses={activeTrip?.expenses || []} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.recentTrips}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trips.slice(0, 4).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="flex items-center justify-between rounded-2xl border bg-white/70 p-4 hover:bg-white">
                <div>
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-sm text-muted-foreground">{trip.destination} · {dateOnly(trip.startDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(trip.totalBudget)}</p>
                  <ArrowRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {trips.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.noTrips}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.upcomingTrips}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcomingTrips.length ? upcomingTrips : trips.slice(0, 3)).map((trip) => (
              <div key={trip.id} className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-4">
                <p className="font-medium">{trip.destination}</p>
                <p className="text-sm text-muted-foreground">{dateOnly(trip.startDate)} - {dateOnly(trip.endDate)} · {trip.numberOfPeople} {t.travelers}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500" style={{ width: `${Math.min(100, (Number(trip.budget?.totalEstimatedCost || 0) / Number(trip.totalBudget || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
            {trips.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.upcomingTrips}</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
