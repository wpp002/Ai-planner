'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { InspirationTrip } from '@/lib/types';
import { money } from '@/lib/utils';
import { Button } from './ui/button';

export const inspirationTrips: InspirationTrip[] = [
  {
    title: 'Weekend Getaway',
    destination: 'Bangkok',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 9000,
    duration: '2 days',
    travelStyle: 'Foodie, Nightlife, Cafe Hopping',
    note: 'A fast, flavorful city escape with night markets, cafes, and rooftop views.'
  },
  {
    title: 'Food Adventures',
    destination: 'Bangkok',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 12000,
    duration: '3 days',
    travelStyle: 'Foodie, Local Markets, Hidden Gems',
    note: 'Focus on local restaurants, street food, dessert shops, and market hopping.'
  },
  {
    title: 'Cafe Hopping Routes',
    destination: 'Chiang Mai',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 11000,
    duration: '3 days',
    travelStyle: 'Cafe Hopping, Photography, Culture',
    note: 'A relaxed itinerary around photogenic cafes, old town lanes, and local shops.'
  },
  {
    title: 'Luxury Escapes',
    destination: 'Phuket',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 35000,
    duration: '4 days',
    travelStyle: 'Luxury, Wellness, Nature',
    note: 'Premium beach clubs, wellness mornings, sunset viewpoints, and fine dining.'
  },
  {
    title: 'Nature Retreats',
    destination: 'Khao Yai',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 16000,
    duration: '3 days',
    travelStyle: 'Nature, Photography, Family',
    note: 'Scenic viewpoints, gentle trails, cafes, farms, and slower family-friendly stops.'
  },
  {
    title: 'Nightlife Experiences',
    destination: 'Bangkok',
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80',
    estimatedBudget: 15000,
    duration: '2 days',
    travelStyle: 'Nightlife, Foodie, Entertainment',
    note: 'Evening-heavy plan with night markets, music bars, rooftops, and late-night eats.'
  }
];

export function TravelInspiration({ onGenerate }: { onGenerate: (trip: InspirationTrip) => Promise<void> | void }) {
  const [generatingTitle, setGeneratingTitle] = useState('');

  async function handleGenerate(trip: InspirationTrip) {
    setGeneratingTitle(trip.title);
    try {
      await onGenerate(trip);
    } finally {
      window.setTimeout(() => setGeneratingTitle(''), 1600);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Travel Inspiration</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Explore ideas before creating a trip</h2>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {inspirationTrips.map((trip) => (
          <div key={trip.title} className="relative min-h-[320px] min-w-[320px] overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
            <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: `url(${trip.image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
            <div className="relative flex h-full min-h-[320px] flex-col justify-end p-5">
              <p className="text-sm text-white/80">{trip.destination} · {trip.duration}</p>
              <h3 className="mt-1 text-2xl font-semibold">{trip.title}</h3>
              <p className="mt-2 text-sm text-white/80">{trip.travelStyle}</p>
              <p className="mt-3 text-sm font-semibold">{money(trip.estimatedBudget)}</p>
              <Button type="button" className="mt-4" disabled={Boolean(generatingTitle)} onClick={() => handleGenerate(trip)}>
                <Sparkles className="h-4 w-4" /> {generatingTitle === trip.title ? 'Generating...' : 'Generate Similar Trip'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
