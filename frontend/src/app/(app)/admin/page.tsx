'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Map, ShieldCheck, UsersRound } from 'lucide-react';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Stats = {
  users: number;
  trips: number;
  totalExpenses: number;
  savedPlaces: number;
  aiFallbacks: number;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
};

type AiUsageLog = {
  id: string;
  provider: string;
  action: string;
  status: string;
  model?: string;
  error?: string;
  createdAt: string;
};

type Health = {
  backend: string;
  database: string;
  aiProvider: string;
  latestMigration?: { migration_name: string; finished_at?: string } | null;
  recentApiErrors?: AiUsageLog[];
  checkedAt: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageLog[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/audit-logs'),
      api.get('/admin/ai-usage'),
      api.get('/admin/health')
    ])
      .then(([statsRes, logsRes, aiRes, healthRes]) => {
        setStats(statsRes.data);
        setAuditLogs(logsRes.data);
        setAiUsage(aiRes.data);
        setHealth(healthRes.data);
      })
      .catch(() => setError('Admin access required.'));
  }, []);

  if (error) return <div className="rounded-md border border-destructive bg-red-50 p-4 text-sm text-destructive">{error}</div>;

  const modules = [
    { href: '/admin/users', title: 'Users', description: 'Manage user accounts and roles.', icon: UsersRound },
    { href: '/admin/trips', title: 'All Trips', description: 'Review all trip plans across the platform.', icon: Map },
    { href: '/admin/analytics', title: 'Analytics', description: 'Monitor platform-wide usage and spending.', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      <section className="premium-card p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Admin Console</p>
            <h1 className="mt-2 text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage users, all trips, and platform analytics from one separated admin area.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Users</p><p className="text-3xl font-semibold">{stats?.users ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Trips</p><p className="text-3xl font-semibold">{stats?.trips ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-3xl font-semibold">{money(stats?.totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Saved Places</p><p className="text-3xl font-semibold">{stats?.savedPlaces ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">AI Fallbacks</p><p className="text-3xl font-semibold">{stats?.aiFallbacks ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">System</p><p className="text-3xl font-semibold">{health?.backend || 'online'}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-indigo-600" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-2xl border bg-white/70 p-3">
                <p className="font-medium">{log.action}</p>
                <p className="text-sm text-muted-foreground">{log.entity} {log.entityId ? `· ${log.entityId}` : ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage Monitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiUsage.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border bg-white/70 p-3">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.provider} {item.model ? `· ${item.model}` : ''}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'FALLBACK' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Backend</p>
            <p className="mt-1 font-semibold">{health?.backend || '-'}</p>
          </div>
          <div className="rounded-2xl border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Database</p>
            <p className="mt-1 font-semibold">{health?.database || '-'}</p>
          </div>
          <div className="rounded-2xl border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">AI Provider</p>
            <p className="mt-1 font-semibold">{health?.aiProvider || '-'}</p>
          </div>
          <div className="rounded-2xl border bg-white/70 p-4">
            <p className="text-sm text-muted-foreground">Last Migration</p>
            <p className="mt-1 truncate font-semibold">{health?.latestMigration?.migration_name || '-'}</p>
          </div>
          <div className="md:col-span-4">
            <p className="mb-2 text-sm font-semibold">Latest API / AI Errors</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {(health?.recentApiErrors || []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">{item.action} · {item.status}</p>
                  <p className="mt-1 line-clamp-2">{item.error || 'No message'}</p>
                </div>
              ))}
              {!health?.recentApiErrors?.length && <p className="text-sm text-muted-foreground">No recent API errors.</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
