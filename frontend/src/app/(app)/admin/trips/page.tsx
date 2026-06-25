'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Trip, User } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type AdminTrip = Trip & {
  user: Pick<User, 'id' | 'name' | 'email'>;
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('ALL');
  const [budgetStatus, setBudgetStatus] = useState('ALL');

  useEffect(() => {
    api.get('/admin/trips').then(({ data }) => setTrips(data));
  }, []);

  const destinations = Array.from(new Set(trips.map((trip) => trip.destination))).sort();
  const filteredTrips = trips.filter((trip) => {
    const estimated = Number(trip.budget?.totalEstimatedCost || 0);
    const totalBudget = Number(trip.totalBudget || 0);
    const status = estimated > totalBudget ? 'OVER' : 'WITHIN';
    const matchesQuery = [trip.title, trip.destination, trip.user?.email].some((value) =>
      String(value || '').toLowerCase().includes(query.toLowerCase())
    );
    return matchesQuery && (destination === 'ALL' || trip.destination === destination) && (budgetStatus === 'ALL' || status === budgetStatus);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">All Trips</h1>
        <p className="text-muted-foreground">Review platform-wide trips and spending activity.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <Input placeholder="Search trips by title, destination, or owner..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option value="ALL">All destinations</option>
              {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={budgetStatus} onChange={(e) => setBudgetStatus(e.target.value)}>
              <option value="ALL">All budgets</option>
              <option value="WITHIN">Within budget</option>
              <option value="OVER">Over budget</option>
            </Select>
          </div>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">Trip</th>
                <th>Owner</th>
                <th>Destination</th>
                <th>Date</th>
                <th>Budget</th>
                <th>Actual</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="border-b">
                  <td className="py-3 font-medium">{trip.title}</td>
                  <td>{trip.user?.email}</td>
                  <td>{trip.destination}</td>
                  <td>{dateOnly(trip.startDate)} - {dateOnly(trip.endDate)}</td>
                  <td>{money(trip.totalBudget)}</td>
                  <td>{money(trip.expenses?.reduce((sum, item) => sum + Number(item.amount), 0))}</td>
                  <td className="text-right">
                    <Link href={`/admin/trips/${trip.id}`}>
                      <Button variant="outline" title="View trip detail">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
