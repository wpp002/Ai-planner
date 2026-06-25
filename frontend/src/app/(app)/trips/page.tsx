'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Trip } from '@/lib/types';
import { dateOnly, money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TripsPage() {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    api.get('/trips').then(({ data }) => setTrips(data));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.tripsTitle}</h1>
        <Link href="/trips/create"><Button>{t.createTrip}</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <Card key={trip.id}>
            <CardHeader>
              <CardTitle>{trip.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{trip.destination}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{dateOnly(trip.startDate)} - {dateOnly(trip.endDate)}</p>
              <p className="text-sm">{t.budget}: {money(trip.totalBudget)}</p>
              <Link className="text-sm font-medium text-primary" href={`/trips/${trip.id}`}>{t.viewDetail}</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
