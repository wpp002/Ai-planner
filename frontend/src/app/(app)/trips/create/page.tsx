'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CircleDollarSign, MapPin, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { DiscoveryPlace, DiscoveryResponse, HotelRecommendation, HotelRecommendationResponse, InspirationTrip } from '@/lib/types';
import { money } from '@/lib/utils';
import { DiscoverySection } from '@/components/discovery-section';
import { HotelRecommendations } from '@/components/hotel-recommendations';
import { TravelInspiration } from '@/components/travel-inspiration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const travelStyles = [
  'Foodie',
  'Shopping',
  'Nightlife',
  'Adventure',
  'Nature',
  'Photography',
  'Wellness',
  'Luxury',
  'Family',
  'Culture',
  'Cafe Hopping',
  'Entertainment'
];

export default function CreateTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [hotelData, setHotelData] = useState<HotelRecommendationResponse | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<DiscoveryPlace[]>([]);
  const [selectedStyles, setSelectedStyles] = useState(['Foodie', 'Cafe Hopping', 'Photography']);
  const [form, setForm] = useState({
    destination: searchParams.get('destination') || '',
    startDate: '',
    endDate: '',
    numberOfDays: 1,
    numberOfPeople: 2,
    totalBudget: 15000,
    note: ''
  });

  function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
      if (error.response?.status === 401) return 'Please login again. Your session may have expired.';
      return error.message;
    }
    return t.aiError;
  }

  const calculatedDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return form.numberOfDays;
    return Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1);
  }, [form.startDate, form.endDate, form.numberOfDays]);
  const canRecommendStays = form.destination.trim().length >= 2;

  useEffect(() => {
    if (form.startDate && form.endDate && calculatedDays !== form.numberOfDays) {
      setForm((current) => ({ ...current, numberOfDays: calculatedDays }));
    }
  }, [calculatedDays, form.startDate, form.endDate, form.numberOfDays]);

  useEffect(() => {
    const raw = localStorage.getItem('tripDraftPlaces');
    if (raw) {
      try {
        setSelectedPlaces(JSON.parse(raw) as DiscoveryPlace[]);
      } catch {
        setSelectedPlaces([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!canRecommendStays) {
      setDiscovery(null);
      return;
    }
    api.post('/ai-planner/discover', {
      destination: form.destination,
      startDate: form.startDate || undefined,
      numberOfPeople: form.numberOfPeople,
      totalBudget: form.totalBudget,
      travelStyle: selectedStyles.join(', ')
    }).then(({ data }) => setDiscovery(data)).catch(() => setDiscovery(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRecommendStays, form.destination, form.startDate, form.numberOfPeople, form.totalBudget, selectedStyles.join(', ')]);

  useEffect(() => {
    if (!canRecommendStays) {
      setHotelData(null);
      return;
    }
    api.post('/ai-planner/hotels', {
      destination: form.destination,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      numberOfPeople: form.numberOfPeople,
      totalBudget: form.totalBudget,
      travelStyle: selectedStyles.join(', '),
      language,
      landmarks: selectedPlaces.map((place) => place.name)
    }).then(({ data }) => setHotelData(data)).catch(() => setHotelData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRecommendStays, form.destination, form.startDate, form.endDate, form.numberOfPeople, form.totalBudget, language, selectedStyles.join(', '), selectedPlaces.map((place) => place.name).join('|')]);

  function toggleStyle(style: string) {
    setSelectedStyles((current) => (current.includes(style) ? current.filter((item) => item !== style) : [...current, style]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!localStorage.getItem('accessToken')) {
      setError('Please login again. Your session may have expired.');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('Generating your AI trip. This can take a few seconds...');
    try {
      const { data } = await api.post('/ai-planner/generate-trip', {
        ...form,
        numberOfDays: calculatedDays,
        travelStyle: selectedStyles.join(', ')
      });
      router.push(`/trips/${data.id}`);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      window.setTimeout(() => setNotice(''), 2400);
    }
  }

  function addPlaceToTrip(place: DiscoveryPlace) {
    setSelectedPlaces((current) => {
      const next = [...current.filter((item) => item.name !== place.name), place].slice(-6);
      localStorage.setItem('tripDraftPlaces', JSON.stringify(next));
      return next;
    });
    setForm((current) => ({
      ...current,
      note: `${current.note ? `${current.note}\n` : ''}Add to trip: ${place.name} (${place.category}) - ${place.reason}`
    }));
    setNotice(language === 'th' ? `เพิ่ม ${place.name} ลงในหมายเหตุแล้ว และจะใช้แนะนำที่พักใกล้ๆ` : `${place.name} added to Additional Notes and stay matching.`);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function addHotelToTrip(hotel: HotelRecommendation) {
    setForm((current) => ({
      ...current,
      note: `${current.note ? `${current.note}\n` : ''}Preferred stay: ${hotel.name} (${hotel.category}) in ${hotel.area}. Estimated ${money(hotel.estimatedNightlyPrice)}/night. ${hotel.reason}`
    }));
    setNotice(language === 'th' ? `เลือก ${hotel.name} ลงในหมายเหตุแล้ว` : `${hotel.name} added to Additional Notes.`);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function removeSelectedPlace(placeName: string) {
    setSelectedPlaces((current) => {
      const next = current.filter((place) => place.name !== placeName);
      localStorage.setItem('tripDraftPlaces', JSON.stringify(next));
      return next;
    });
  }

  async function generateSimilarTrip(inspiration: InspirationTrip) {
    if (!localStorage.getItem('accessToken')) {
      setError('Please login again. Your session may have expired.');
      return;
    }
    setLoading(true);
    setNotice(`Generating a similar trip from ${inspiration.title}...`);
    setError('');
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const days = Number(inspiration.duration.match(/\d+/)?.[0] || 3);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);
    try {
      const { data } = await api.post('/ai-planner/generate-trip', {
        destination: inspiration.destination,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        numberOfDays: days,
        numberOfPeople: form.numberOfPeople,
        totalBudget: inspiration.estimatedBudget,
        travelStyle: inspiration.travelStyle,
        note: `Generate a similar trip inspired by: ${inspiration.title}. ${inspiration.note}`
      });
      router.push(`/trips/${data.id}`);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      window.setTimeout(() => setNotice(''), 2400);
    }
  }

  return (
    <div className="space-y-8">
      <section className="premium-card overflow-hidden">
        <div className="grid gap-8 p-7 lg:grid-cols-[1fr_380px] lg:p-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">{t.createEyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {t.createTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {t.createSubtitle}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <Sparkles className="mb-5 h-6 w-6 text-sky-300" />
            <p className="text-lg font-semibold">{t.preview}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-xl bg-white/10 p-3">Budget target: {money(form.totalBudget)}</div>
              <div className="rounded-xl bg-white/10 p-3">Duration: {calculatedDays} days</div>
              <div className="rounded-xl bg-white/10 p-3">Styles: {selectedStyles.slice(0, 3).join(', ')}</div>
            </div>
          </div>
        </div>
      </section>

      <TravelInspiration onGenerate={generateSimilarTrip} />

      {notice && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">{notice}</div>}

      <Card className="mx-auto max-w-5xl">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={submit} className="space-y-7">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
              <Label>{t.destination}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.startDate}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t.endDate}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t.numberOfDays}</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="number" min={1} value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.numberOfPeople}</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="number" min={1} value={form.numberOfPeople} onChange={(e) => setForm({ ...form, numberOfPeople: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t.totalBudget}</Label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="number" min={1} value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })} required />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t.travelStyle}</Label>
              <div className="flex flex-wrap gap-2">
                {travelStyles.map((style) => {
                  const active = selectedStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-indigo-600 bg-slate-950 text-white shadow-lg shadow-indigo-500/15'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-950'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.additionalNotes}</Label>
              <Textarea
                placeholder={t.notesPlaceholder}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-destructive">{error}</p>}

            <motion.div whileHover={{ scale: 1.006 }} whileTap={{ scale: 0.99 }}>
              <Button className="h-12 w-full text-base" disabled={loading || selectedStyles.length === 0}>
                <Sparkles className="h-5 w-5" /> {loading ? t.generating : t.generateTrip}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>

      {discovery && (
        <div className="space-y-8">
          <DiscoverySection
            title={language === 'th' ? 'สถานที่ยอดนิยมช่วงนี้' : 'Popular Places This Season'}
            subtitle={language === 'th' ? 'สถานที่เที่ยว คาเฟ่ ร้านอาหาร ตลาดกลางคืน ย่านช้อปปิ้ง อีเวนต์ และเทศกาลที่เหมาะกับทริปนี้' : 'AI-matched attractions, cafes, restaurants, night markets, shopping districts, local events, and festivals.'}
            places={discovery.trendingRightNow}
            onAddToTrip={addPlaceToTrip}
            limit={3}
          />
          <DiscoverySection
            title={language === 'th' ? 'แนะนำตามฤดูกาล' : 'Seasonal Recommendations'}
            subtitle={language === 'th' ? 'คำแนะนำที่จัดลำดับตามช่วงเดือนหรือวันที่เดินทางของคุณ' : 'Recommendations prioritized by your selected travel month.'}
            places={discovery.seasonalEvents}
            onAddToTrip={addPlaceToTrip}
            limit={3}
          />
        </div>
      )}

      {selectedPlaces.length > 0 && (
        <section className="rounded-2xl border bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-semibold">{language === 'th' ? 'ค้นหาที่พักใกล้สถานที่ที่เลือก' : 'Find stays near your selected places'}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === 'th' ? 'ระบบจะใช้สถานที่เหล่านี้ในการแนะนำที่พักใกล้ๆ ถ้าไม่ต้องการจุดไหนให้กดลบออกได้' : 'Hotel suggestions will prioritize these attractions. You can remove any place before choosing a stay.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPlaces.map((place) => (
              <button
                key={place.name}
                type="button"
                onClick={() => removeSelectedPlace(place.name)}
                className="rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                title={language === 'th' ? 'เอาออกจากการค้นหาที่พัก' : 'Remove from stay search'}
              >
                {place.name} x
              </button>
            ))}
          </div>
        </section>
      )}

      {hotelData && (
        <HotelRecommendations
          hotels={hotelData.hotels}
          budgetNote={hotelData.budgetNote}
          onAddHotel={addHotelToTrip}
          hasSelectedPlaces={selectedPlaces.length > 0}
        />
      )}
    </div>
  );
}
