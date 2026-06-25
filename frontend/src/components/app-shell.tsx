'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Gauge,
  Heart,
  LogOut,
  Map as MapIcon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { api, clearSession } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { DiscoveryPlace, Trip, User } from '@/lib/types';
import { cn, dateOnly, money } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { Button } from './ui/button';

const userNav = [
  { href: '/dashboard', labelKey: 'navDashboard', icon: Gauge },
  { href: '/trips', labelKey: 'navTrips', icon: MapIcon },
  { href: '/trips/create', labelKey: 'navCreate', icon: Plus },
  { href: '/saved-places', labelKey: 'navSaved', icon: Heart }
];

const adminNav = [
  { href: '/admin', labelKey: 'navAdminDashboard', icon: ShieldCheck },
  { href: '/admin/users', labelKey: 'navAdminUsers', icon: UsersRound },
  { href: '/admin/trips', labelKey: 'navAdminTrips', icon: MapIcon },
  { href: '/admin/analytics', labelKey: 'navAdminAnalytics', icon: Gauge }
];

const destinationAliases: Record<string, string[]> = {
  pattaya: ['pattaya', 'พัทยา', 'chonburi', 'ชลบุรี'],
  'พัทยา': ['pattaya', 'พัทยา', 'chonburi', 'ชลบุรี'],
  chonburi: ['pattaya', 'พัทยา', 'chonburi', 'ชลบุรี'],
  'ชลบุรี': ['pattaya', 'พัทยา', 'chonburi', 'ชลบุรี'],
  bangkok: ['bangkok', 'กรุงเทพ', 'กรุงเทพฯ', 'bkk'],
  'กรุงเทพ': ['bangkok', 'กรุงเทพ', 'กรุงเทพฯ', 'bkk'],
  phuket: ['phuket', 'ภูเก็ต'],
  'ภูเก็ต': ['phuket', 'ภูเก็ต'],
  chiangmai: ['chiang mai', 'chiangmai', 'เชียงใหม่'],
  'เชียงใหม่': ['chiang mai', 'chiangmai', 'เชียงใหม่']
};

function expandSearchTerms(value: string) {
  const normalized = value.trim().toLowerCase();
  const terms = new Set([normalized]);
  Object.entries(destinationAliases).forEach(([key, aliases]) => {
    if (normalized.includes(key.toLowerCase()) || aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      aliases.forEach((alias) => terms.add(alias.toLowerCase()));
    }
  });
  return Array.from(terms).filter(Boolean);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [query, setQuery] = useState('');
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryPlace[]>([]);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    api.get('/auth/profile').then(({ data }) => setUser(data)).catch(() => setUser(null));
    api.get('/trips').then(({ data }) => setTrips(data || [])).catch(() => setTrips([]));
  }, []);

  const currentTrip = trips[0] ?? null;
  const searchResults = useMemo(() => {
    const terms = expandSearchTerms(query);
    if (!terms.length) return [];
    return trips
      .filter((trip) => {
        const searchableText = [trip.title, trip.destination, trip.summary, trip.travelStyle, ...expandSearchTerms(trip.destination)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return terms.some((term) => searchableText.includes(term));
      })
      .slice(0, 6);
  }, [query, trips]);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPPORT';

  useEffect(() => {
    const destination = query.trim();
    if (isStaff || destination.length < 2) {
      setDiscoveryResults([]);
      setDiscovering(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setDiscovering(true);
      api.post('/ai-planner/discover', {
        destination,
        numberOfPeople: currentTrip?.numberOfPeople || 2,
        totalBudget: currentTrip?.totalBudget || 15000,
        travelStyle: currentTrip?.travelStyle || 'Foodie, Cafe Hopping, Local Experiences'
      })
        .then(({ data }) => {
          if (cancelled) return;
          const places = [
            ...(data.trendingRightNow || []),
            ...(data.recommendedForYou || []),
            ...(data.seasonalEvents || []),
            ...(data.hiddenGems || [])
          ];
          const unique = new Map<string, DiscoveryPlace>();
          places.forEach((place: DiscoveryPlace) => unique.set(`${place.name}-${place.category}`, place));
          setDiscoveryResults(Array.from(unique.values()).slice(0, 5));
        })
        .catch(() => {
          if (!cancelled) setDiscoveryResults([]);
        })
        .finally(() => {
          if (!cancelled) setDiscovering(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentTrip?.numberOfPeople, currentTrip?.totalBudget, currentTrip?.travelStyle, isStaff, query]);

  function logout() {
    clearSession();
    router.push('/login');
  }

  function goToTrip(id: string) {
    setQuery('');
    router.push(`/trips/${id}`);
  }

  function createTripFromSearch(destination = query.trim()) {
    setQuery('');
    router.push(`/trips/create?destination=${encodeURIComponent(destination)}`);
  }

  function renderNav(items: typeof userNav) {
    return items.map((item) => {
      const Icon = item.icon;
      const active =
        pathname === item.href ||
        (item.href === '/trips' && pathname.startsWith('/trips/') && !pathname.startsWith('/trips/create')) ||
        (item.href !== '/dashboard' && item.href !== '/trips' && pathname.startsWith(item.href));
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-slate-100 hover:text-foreground',
            active && 'bg-slate-950 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-950 hover:text-white'
          )}
        >
          <Icon className="h-4 w-4" />
          {t[item.labelKey as keyof typeof t]}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-white/70 bg-white/80 px-4 py-5 shadow-[20px_0_70px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">{t.brand}</p>
            <p className="text-xs text-muted-foreground">{t.tagline}</p>
          </div>
        </Link>

        <nav className="space-y-6">
          {isStaff ? (
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {language === 'th' ? 'เมนูผู้ดูแล' : 'Admin Console'}
              </p>
              <div className="space-y-1">
                {renderNav(adminNav)}
                <div className="rounded-xl border bg-indigo-50/70 p-3 text-xs text-indigo-900">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <UsersRound className="h-3.5 w-3.5" />
                    {user?.role === 'ADMIN' ? 'ADMIN access' : 'SUPPORT access'}
                  </div>
                  {user?.role === 'ADMIN' ? 'Manage users, roles, all trips, and platform analytics.' : 'Read-only access for users, trips, analytics, and support investigation.'}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {language === 'th' ? 'เมนูผู้ใช้' : 'User Workspace'}
              </p>
              <div className="space-y-1">{renderNav(userNav)}</div>
            </div>
          )}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4">
          <Sparkles className="mb-3 h-5 w-5 text-indigo-600" />
          <p className="text-sm font-semibold">AI itinerary engine</p>
          <p className="mt-1 text-xs text-muted-foreground">Balanced routes, budget insight, and local-first recommendations.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-background/80 backdrop-blur-xl">
          <div className="flex min-h-20 flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
                <Compass className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold">{t.brand}</span>
              </Link>
              <Button variant="ghost" onClick={logout} title={t.logout} className="lg:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isStaff && (
                <>
                  <div className="relative hidden md:block">
                    <div className="flex h-10 w-[320px] items-center gap-2 rounded-xl border bg-white/80 px-3 text-sm shadow-sm">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t.search}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    {query.trim() && (
                      <div className="absolute right-0 top-12 z-50 w-[420px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
                        {searchResults.length > 0 || discoveryResults.length > 0 || discovering ? (
                          <div className="max-h-[520px] overflow-auto p-2">
                            {searchResults.length > 0 && (
                              <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {language === 'th' ? 'ทริปของฉัน' : 'My Trips'}
                              </div>
                            )}
                            {searchResults.map((trip) => (
                              <button
                                key={trip.id}
                                type="button"
                                onClick={() => goToTrip(trip.id)}
                                className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-50"
                              >
                                <div>
                                  <p className="font-medium text-slate-950">{trip.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {trip.destination} · {dateOnly(trip.startDate)} · {trip.numberOfPeople} {t.travelers}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-indigo-600">{money(trip.totalBudget)}</p>
                              </button>
                            ))}
                            {(discoveryResults.length > 0 || discovering) && (
                              <div className="mt-2 border-t pt-2">
                                <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  {language === 'th' ? 'ค้นพบทริปและสถานที่อื่น' : 'Explore New Trips'}
                                </div>
                                {discovering && !discoveryResults.length && (
                                  <div className="rounded-xl p-3 text-sm text-muted-foreground">
                                    {language === 'th' ? 'กำลังค้นหาสถานที่แนะนำ...' : 'Searching travel ideas...'}
                                  </div>
                                )}
                                {discoveryResults.map((place) => (
                                  <button
                                    key={`${place.name}-${place.category}`}
                                    type="button"
                                    onClick={() => createTripFromSearch(query.trim())}
                                    className="flex w-full items-start justify-between gap-3 rounded-xl p-3 text-left hover:bg-slate-50"
                                  >
                                    <div>
                                      <p className="font-medium text-slate-950">{place.name}</p>
                                      <p className="text-xs text-muted-foreground">{place.category} · Score {place.trendScore}</p>
                                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{place.shortDescription || place.reason}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-sm font-semibold text-indigo-600">{money(place.estimatedBudget)}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{language === 'th' ? 'สร้างทริป' : 'Create'}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 text-sm">
                            <p className="text-muted-foreground">
                              {language === 'th' ? `ยังไม่พบไอเดียสำหรับ "${query.trim()}"` : `No travel ideas found for "${query.trim()}".`}
                            </p>
                            <button
                              type="button"
                              onClick={() => createTripFromSearch()}
                              className="flex w-full items-center justify-between rounded-xl border bg-slate-950 px-4 py-3 text-left font-semibold text-white hover:bg-slate-800"
                            >
                              <span>{language === 'th' ? `สร้างทริป ${query.trim()}` : `Create trip for ${query.trim()}`}</span>
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </>
              )}
              <LanguageSwitcher />
              <div className="hidden items-center gap-3 rounded-xl border bg-white/80 px-3 py-2 shadow-sm sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                  {user?.name?.slice(0, 1).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.name || t.traveler}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'USER'}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={logout} title={t.logout} className="hidden border bg-white/80 lg:inline-flex">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="px-4 py-6 lg:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
