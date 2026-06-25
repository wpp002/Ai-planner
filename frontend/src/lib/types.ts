export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  _count?: { trips: number };
};

export type Activity = {
  id: string;
  time: string;
  title: string;
  location: string;
  description?: string;
  category: string;
  estimatedCost: number;
};

export type TripDay = {
  id: string;
  dayNumber: number;
  date: string;
  activities: Activity[];
};

export type Budget = {
  id: string;
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  shopping: number;
  emergency: number;
  totalEstimatedCost: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  note?: string;
  expenseDate: string;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  totalBudget: number;
  travelStyle: string;
  summary?: string;
  budget?: Budget | null;
  days: TripDay[];
  expenses: Expense[];
};

export type DiscoveryPlace = {
  id?: string;
  name: string;
  category: string;
  trendScore: number;
  estimatedBudget: number;
  reason: string;
  shortDescription: string;
  imageHint: string;
};

export type DiscoveryResponse = {
  trendingRightNow: DiscoveryPlace[];
  seasonalEvents: DiscoveryPlace[];
  recommendedForYou: DiscoveryPlace[];
  hiddenGems: DiscoveryPlace[];
  popularNearbyAttractions: DiscoveryPlace[];
};

export type InspirationTrip = {
  title: string;
  destination: string;
  image: string;
  estimatedBudget: number;
  duration: string;
  travelStyle: string;
  note: string;
};

export type HotelRecommendation = {
  name: string;
  area: string;
  category: 'Budget Stay' | 'Best Value' | 'Near Attractions' | 'Family Friendly' | 'Luxury Pick';
  estimatedNightlyPrice: number;
  rating: number;
  fitFor: string;
  distanceToHighlights: string;
  reason: string;
  imageHint: string;
};

export type HotelRecommendationResponse = {
  destination: string;
  budgetNote: string;
  hotels: HotelRecommendation[];
};
