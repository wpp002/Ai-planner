'use client';

import { Bookmark, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DiscoveryPlace } from '@/lib/types';
import { money } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const fallbackImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80'
];

export function DiscoverySection({
  title,
  subtitle,
  places,
  onAddToTrip,
  limit = 3
}: {
  title: string;
  subtitle?: string;
  places: DiscoveryPlace[];
  onAddToTrip?: (place: DiscoveryPlace) => void;
  limit?: number;
}) {
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  if (!places.length) return null;

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(''), 2200);
  }

  async function savePlace(place: DiscoveryPlace) {
    try {
      await api.post('/saved-places', place);
      setSavedPlaces((items) => (items.includes(place.name) ? items : [...items, place.name]));
      showMessage(`Saved ${place.name}.`);
    } catch {
      const raw = localStorage.getItem('savedDiscoveryPlaces');
      const current = raw ? (JSON.parse(raw) as DiscoveryPlace[]) : [];
      const exists = current.some((item) => item.name === place.name);
      const next = exists ? current : [...current, place];
      localStorage.setItem('savedDiscoveryPlaces', JSON.stringify(next));
      setSavedPlaces((items) => (items.includes(place.name) ? items : [...items, place.name]));
      showMessage(exists ? `${place.name} is already saved locally.` : `Saved ${place.name} locally.`);
    }
  }

  function addPlace(place: DiscoveryPlace) {
    const raw = localStorage.getItem('tripDraftPlaces');
    const current = raw ? (JSON.parse(raw) as DiscoveryPlace[]) : [];
    localStorage.setItem('tripDraftPlaces', JSON.stringify([...current.filter((item) => item.name !== place.name), place]));
    onAddToTrip?.(place);
    showMessage(`Added ${place.name} to your trip ideas.`);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">{message}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {places.slice(0, limit).map((place, index) => (
          <Card key={`${title}-${place.name}`} className="overflow-hidden">
            <div
              className="h-36 bg-cover bg-center"
              style={{ backgroundImage: `url(${fallbackImages[index % fallbackImages.length]})` }}
            />
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-snug">{place.name}</p>
                  <p className="text-xs text-muted-foreground">{place.category}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  <Star className="h-3 w-3 fill-indigo-600" /> {place.trendScore}
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{place.shortDescription || place.reason}</p>
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Estimated budget</p>
                <p className="font-semibold">{money(place.estimatedBudget)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="px-2" onClick={() => savePlace(place)}>
                  <Bookmark className="h-4 w-4" /> {savedPlaces.includes(place.name) ? 'Saved' : 'Save'}
                </Button>
                <Button type="button" className="px-2" onClick={() => addPlace(place)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
