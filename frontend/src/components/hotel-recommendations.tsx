'use client';

import { Building2, MapPin, Plus, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { HotelRecommendation } from '@/lib/types';
import { money } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const hotelImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80'
];

export function HotelRecommendations({
  hotels,
  budgetNote,
  onAddHotel,
  hasSelectedPlaces = false
}: {
  hotels: HotelRecommendation[];
  budgetNote?: string;
  onAddHotel: (hotel: HotelRecommendation) => void;
  hasSelectedPlaces?: boolean;
}) {
  const { language } = useLanguage();
  if (!hotels.length) return null;

  const th = language === 'th';
  const categoryLabel = (category: HotelRecommendation['category']) => {
    if (!th) return category;
    return {
      'Budget Stay': 'ประหยัดงบ',
      'Best Value': 'คุ้มค่าที่สุด',
      'Near Attractions': 'ใกล้ที่เที่ยว',
      'Family Friendly': 'เหมาะกับครอบครัว',
      'Luxury Pick': 'พรีเมียม'
    }[category];
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {hasSelectedPlaces
              ? th ? 'ที่พักใกล้สถานที่ที่เลือก' : 'Stays Near Your Places'
              : th ? 'ที่พักแนะนำอัจฉริยะ' : 'Smart Stay Recommendations'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSelectedPlaces
              ? th ? 'ตัวเลือกที่พักใกล้สถานที่เที่ยวที่คุณเพิ่มไว้ จะเลือกใช้หรือไม่ใช้ก็ได้' : 'Optional hotel and stay picks near the attractions you added to this trip.'
              : th ? 'แนะนำโซนที่พักและราคาโดยประมาณต่อคืนให้เหมาะกับงบและสไตล์ทริป' : 'AI-matched hotel areas and estimated nightly prices for your trip budget.'}
          </p>
        </div>
        {budgetNote && <p className="max-w-xl text-xs text-muted-foreground">{budgetNote}</p>}
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory">
        {hotels.slice(0, 5).map((hotel, index) => (
          <Card key={`${hotel.name}-${hotel.area}`} className="w-[320px] shrink-0 snap-start overflow-hidden md:w-[380px]">
            <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${hotelImages[index % hotelImages.length]})` }} />
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-snug">{hotel.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {hotel.area}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-500" /> {hotel.rating.toFixed(1)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{categoryLabel(hotel.category)}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{money(hotel.estimatedNightlyPrice)}/{th ? 'คืน' : 'night'}</span>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">{hotel.reason}</p>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{th ? 'เหมาะสำหรับ' : 'Best for'}</p>
                <p className="mt-1">{hotel.fitFor}</p>
                <p className="mt-2 flex items-center gap-1"><Building2 className="h-3 w-3" /> {hotel.distanceToHighlights}</p>
              </div>

              <Button type="button" className="w-full" onClick={() => onAddHotel(hotel)}>
                <Plus className="h-4 w-4" /> {th ? 'เลือกที่พักนี้' : 'Use This Stay'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
