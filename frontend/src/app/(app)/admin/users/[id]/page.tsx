'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Shield, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DiscoveryPlace, Trip, User, UserRole } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  savedPlaces: DiscoveryPlace[];
  trips: Trip[];
  totalExpenses: number;
  _count: { trips: number; savedPlaces: number };
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const canManageUsers = currentUser?.role === 'ADMIN';

  async function load() {
    const { data } = await api.get(`/admin/users/${params.id}`);
    setUser(data);
  }

  useEffect(() => {
    load();
    api.get('/auth/profile').then(({ data }) => setCurrentUser(data)).catch(() => setCurrentUser(null));
  }, [params.id]);

  const totalBudget = useMemo(() => user?.trips.reduce((sum, trip) => sum + Number(trip.totalBudget), 0) || 0, [user]);

  async function updateRole(role: UserRole) {
    await api.patch(`/admin/users/${params.id}/role`, { role });
    await load();
  }

  async function deleteUser() {
    await api.delete(`/admin/users/${params.id}`);
    router.push('/admin/users');
  }

  if (!user) return <div className="text-muted-foreground">Loading user detail...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/users" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
          <h1 className="text-3xl font-semibold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {canManageUsers ? (
          <div className="flex gap-2">
            <Select className="w-36" value={user.role} onChange={(e) => updateRole(e.target.value as UserRole)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPPORT">SUPPORT</option>
            </Select>
            <Button variant="destructive" onClick={deleteUser}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Read-only support view</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Role</p><p className="mt-1 flex items-center gap-2 text-2xl font-semibold"><Shield className="h-5 w-5" />{user.role}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Trips</p><p className="text-3xl font-semibold">{user._count.trips}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Saved Places</p><p className="text-3xl font-semibold">{user._count.savedPlaces}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Joined</p><p className="text-xl font-semibold">{dateOnly(user.createdAt)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Trip Budgets</p><p className="text-3xl font-semibold">{money(totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Actual Expenses</p><p className="text-3xl font-semibold">{money(user.totalExpenses)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>User Trips</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {user.trips.map((trip) => (
              <Link key={trip.id} href={`/admin/trips/${trip.id}`} className="block rounded-2xl border bg-white/70 p-4 transition hover:bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{trip.title}</p>
                    <p className="text-sm text-muted-foreground">{trip.destination} · {dateOnly(trip.startDate)} - {dateOnly(trip.endDate)}</p>
                  </div>
                  <p className="font-semibold">{money(trip.totalBudget)}</p>
                </div>
              </Link>
            ))}
            {!user.trips.length && <p className="text-sm text-muted-foreground">No trips yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Saved Places</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {user.savedPlaces.map((place) => (
              <div key={place.id || place.name} className="rounded-2xl border bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{place.name}</p>
                    <p className="text-sm text-muted-foreground">{place.category}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{place.trendScore}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{place.shortDescription}</p>
              </div>
            ))}
            {!user.savedPlaces.length && <p className="text-sm text-muted-foreground">No saved places.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
