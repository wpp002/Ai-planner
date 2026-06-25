'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookmarkCheck, Heart, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DiscoveryPlace, Trip } from '@/lib/types';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const images = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80'
];

export default function SavedPlacesPage() {
  const [places, setPlaces] = useState<DiscoveryPlace[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [time, setTime] = useState('14:00');
  const [notice, setNotice] = useState('');

  async function load() {
    const [savedRes, tripsRes] = await Promise.all([api.get('/saved-places'), api.get('/trips')]);
    setPlaces(savedRes.data);
    setTrips(tripsRes.data);
    const firstDay = tripsRes.data?.[0]?.days?.[0]?.id;
    if (firstDay && !selectedDayId) setSelectedDayId(firstDay);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('savedDiscoveryPlaces');
    if (!raw) return;
    const localPlaces = JSON.parse(raw) as DiscoveryPlace[];
    Promise.all(localPlaces.map((place) => api.post('/saved-places', place).catch(() => null))).then(() => {
      localStorage.removeItem('savedDiscoveryPlaces');
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tripDays = useMemo(() => {
    return trips.flatMap((trip) => trip.days.map((day) => ({ id: day.id, label: `${trip.title} - Day ${day.dayNumber}` })));
  }, [trips]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  }

  async function removePlace(id?: string) {
    if (!id) return;
    await api.delete(`/saved-places/${id}`);
    showNotice('Removed from saved places.');
    await load();
  }

  async function addToTrip(place: DiscoveryPlace) {
    if (!place.id || !selectedDayId) {
      showNotice('Select a trip day first.');
      return;
    }
    await api.post(`/saved-places/${place.id}/add-to-trip`, {
      tripDayId: selectedDayId,
      time,
      estimatedCost: place.estimatedBudget
    });
    showNotice(`${place.name} added to your itinerary.`);
  }

  return (
    <div className="space-y-6">
      <section className="premium-card p-7">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Travel Library</p>
            <h1 className="mt-2 text-3xl font-semibold">Saved Places</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Saved discovery places are now stored in your account and can be added directly to a trip itinerary.
            </p>
          </div>
          <div className="grid gap-3 rounded-2xl border bg-white/70 p-4 md:grid-cols-[260px_120px_auto] md:items-end">
            <div className="space-y-2">
              <Label>Trip Day</Label>
              <Select value={selectedDayId} onChange={(e) => setSelectedDayId(e.target.value)}>
                <option value="">Select trip day</option>
                {tripDays.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <Link href="/trips/create">
              <Button><Plus className="h-4 w-4" /> Create Trip</Button>
            </Link>
          </div>
        </div>
      </section>

      {notice && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">{notice}</div>}

      {places.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">No saved places yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Go to Dashboard or Create Trip and press Save on any travel discovery card.
            </p>
            <Link href="/dashboard">
              <Button className="mt-5">Explore Discovery</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {places.map((place, index) => (
            <Card key={place.id || place.name} className="overflow-hidden">
              <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${images[index % images.length]})` }} />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{place.name}</p>
                    <p className="text-sm text-muted-foreground">{place.category}</p>
                  </div>
                  <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    {place.trendScore}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{place.shortDescription || place.reason}</p>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">Estimated budget</p>
                  <p className="font-semibold">{money(place.estimatedBudget)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => removePlace(place.id)}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                  <Button onClick={() => addToTrip(place)} disabled={!selectedDayId}>
                    <BookmarkCheck className="h-4 w-4" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
