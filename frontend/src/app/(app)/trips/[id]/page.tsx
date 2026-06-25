'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Brain, ChevronDown, Pencil, Plus, RefreshCw, Route, Sparkles, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Trip, User } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { BudgetChart } from '@/components/budget-chart';
import { TripExport } from '@/components/trip-export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [activity, setActivity] = useState({ tripDayId: '', time: '09:00', title: '', location: '', description: '', category: 'food', estimatedCost: 0 });

  async function load() {
    const { data } = await api.get(`/trips/${id}`);
    setTrip(data);
    if (!activity.tripDayId && data.days?.[0]?.id) setActivity((current) => ({ ...current, tripDayId: data.days[0].id }));
  }

  useEffect(() => {
    load();
    api.get('/auth/profile').then(({ data }) => setCurrentUser(data)).catch(() => setCurrentUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addActivity(event: React.FormEvent) {
    event.preventDefault();
    await api.post('/activities', activity);
    setActivity({ ...activity, title: '', description: '', estimatedCost: 0 });
    await load();
  }

  async function deleteActivity(activityId: string) {
    await api.delete(`/activities/${activityId}`);
    await load();
  }

  async function editActivity(itemId: string, currentTime: string, currentCost: number) {
    const time = window.prompt('New activity time', currentTime);
    if (!time) return;
    const cost = Number(window.prompt('New estimated cost', String(currentCost)) || currentCost);
    await api.patch(`/activities/${itemId}`, { time, estimatedCost: cost });
    await load();
  }

  async function editTrip() {
    const title = window.prompt('Trip title', trip?.title || '');
    if (!title) return;
    const summary = window.prompt('Trip summary', trip?.summary || '') || trip?.summary;
    await api.patch(`/trips/${id}`, { title, summary });
    await load();
  }

  async function deleteTrip() {
    await api.delete(`/trips/${id}`);
    router.push('/trips');
  }

  if (!trip) return <div className="premium-card p-8 text-sm text-muted-foreground">{t.loadingTrip}</div>;

  const actualSpent = trip.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const estimated = Number(trip.budget?.totalEstimatedCost || 0);
  const budgetUsage = Math.min(100, Math.round((estimated / Number(trip.totalBudget || 1)) * 100));
  const activityCount = trip.days.reduce((sum, day) => sum + day.activities.length, 0);
  const canDeleteTrip = currentUser?.role !== 'SUPPORT';

  return (
    <div className="space-y-7">
      <section className="premium-card overflow-hidden p-7">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">{trip.destination}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950">{trip.title}</h1>
            <p className="mt-3 text-muted-foreground">
              {dateOnly(trip.startDate)} - {dateOnly(trip.endDate)} · {trip.numberOfPeople} {t.travelers} · {activityCount} {t.curatedActivities}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TripExport trip={trip} />
            <Button variant="outline" onClick={editTrip}><Pencil className="h-4 w-4" /> {t.edit}</Button>
            <Link href={`/trips/${trip.id}/budget`}><Button variant="outline">{t.budget}</Button></Link>
            <Link href={`/trips/${trip.id}/expenses`}><Button variant="outline">{t.expenses}</Button></Link>
            <Button variant="outline" title={t.regenerate}><RefreshCw className="h-4 w-4" /> {t.regenerate}</Button>
            {canDeleteTrip && <Button variant="destructive" onClick={deleteTrip}><Trash2 className="h-4 w-4" /> {t.delete}</Button>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: t.totalBudgetLabel, value: money(trip.totalBudget) },
          { label: t.estimatedCosts, value: money(estimated) },
          { label: t.actualSpent, value: money(actualSpent) },
          { label: t.budgetStatus, value: estimated > Number(trip.totalBudget) ? t.needsOptimization : t.onTrack }
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-600" /> {t.aiSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground">{trip.summary}</p>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.estimatedBudgetUsage}</span>
                  <span className="font-medium">{budgetUsage}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500" style={{ width: `${budgetUsage}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-indigo-600" /> {t.timeline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip.days.map((day) => (
                <div key={day.id} className="overflow-hidden rounded-2xl border bg-white/80">
                  <button
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    onClick={() => setOpenDay(openDay === day.dayNumber ? null : day.dayNumber)}
                  >
                    <div>
                      <p className="font-semibold">{t.day} {day.dayNumber}</p>
                      <p className="text-sm text-muted-foreground">{dateOnly(day.date)} · {day.activities.length} activities</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition ${openDay === day.dayNumber ? 'rotate-180' : ''}`} />
                  </button>
                  {openDay === day.dayNumber && (
                    <div className="space-y-4 border-t px-5 py-5">
                      {day.activities.map((item) => (
                        <div key={item.id} className="grid gap-4 md:grid-cols-[88px_1fr_auto]">
                          <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center font-semibold text-indigo-700">{item.time}</div>
                          <div className="relative border-l pl-5">
                            <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.location} · {item.category} · {money(item.estimatedCost)}</p>
                            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" title="Edit time and cost" onClick={() => editActivity(item.id, item.time, Number(item.estimatedCost))}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" title="Delete activity" onClick={() => deleteActivity(item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t.budgetBreakdown}</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetChart budget={trip.budget} expenses={trip.expenses} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-600" /> {t.aiInsights}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(language === 'th'
                ? [
                    'แผนนี้จัดกิจกรรมและช่วงพักให้สมดุล ไม่แน่นเกินไป',
                    'ควรเผื่อช่วงเย็นไว้ 1 ช่วงสำหรับปรับตามอากาศหรือคำแนะนำท้องถิ่น',
                    estimated > Number(trip.totalBudget) ? 'ลองใช้ Budget Optimizer เพื่อลดค่าใช้จ่ายโดยยังคงคุณภาพทริปไว้' : 'ค่าใช้จ่ายประมาณการยังอยู่ในงบที่ตั้งไว้'
                  ]
                : [
                    'The plan includes a balanced mix of activities and rest windows.',
                    'Keep one flexible evening for a weather-friendly local recommendation.',
                    estimated > Number(trip.totalBudget) ? 'Run Budget Optimizer to reduce spend without losing trip quality.' : 'Your estimated cost is within the target budget.'
                  ]
              ).map((insight) => (
                <div key={insight} className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-4 text-sm text-slate-700">
                  {insight}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><Plus className="mr-2 inline h-4 w-4" /> {t.addActivity}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addActivity} className="space-y-3">
                <div className="space-y-2">
                  <Label>{t.day}</Label>
                  <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={activity.tripDayId} onChange={(e) => setActivity({ ...activity, tripDayId: e.target.value })}>
                    {trip.days.map((day) => <option key={day.id} value={day.id}>{t.day} {day.dayNumber}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>{t.time}</Label><Input value={activity.time} onChange={(e) => setActivity({ ...activity, time: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t.cost}</Label><Input type="number" value={activity.estimatedCost} onChange={(e) => setActivity({ ...activity, estimatedCost: Number(e.target.value) })} /></div>
                </div>
                <div className="space-y-2"><Label>{t.title}</Label><Input value={activity.title} onChange={(e) => setActivity({ ...activity, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>{t.location}</Label><Input value={activity.location} onChange={(e) => setActivity({ ...activity, location: e.target.value })} required /></div>
                <div className="space-y-2"><Label>{t.description}</Label><Textarea value={activity.description} onChange={(e) => setActivity({ ...activity, description: e.target.value })} /></div>
                <Button className="w-full"><Pencil className="h-4 w-4" /> {t.saveActivity}</Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
