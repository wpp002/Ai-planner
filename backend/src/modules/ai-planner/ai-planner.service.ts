import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TripsService } from '../trips/trips.service';
import { GenerateTripDto } from './dto/generate-trip.dto';
import { DiscoverPlacesDto } from './dto/discover-places.dto';
import { RecommendHotelsDto } from './dto/recommend-hotels.dto';
import { OptimizeBudgetDto } from './dto/optimize-budget.dto';

type AiTrip = {
  tripTitle: string;
  summary: string;
  days: Array<{
    dayNumber: number;
    date: string;
    activities: Array<{
      time: string;
      title: string;
      location: string;
      description: string;
      estimatedCost: number;
      category: string;
    }>;
  }>;
  budget: {
    accommodation: number;
    food: number;
    transportation: number;
    activities: number;
    shopping: number;
    emergency: number;
    totalEstimatedCost: number;
  };
  budgetStatus: 'within_budget' | 'over_budget';
  savingTips: string[];
};

type DiscoveryPlace = {
  name: string;
  category: string;
  trendScore: number;
  estimatedBudget: number;
  reason: string;
  shortDescription: string;
  imageHint: string;
};

type DiscoveryResponse = {
  trendingRightNow: DiscoveryPlace[];
  seasonalEvents: DiscoveryPlace[];
  recommendedForYou: DiscoveryPlace[];
  hiddenGems: DiscoveryPlace[];
  popularNearbyAttractions: DiscoveryPlace[];
};

type HotelRecommendation = {
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

type HotelRecommendationResponse = {
  destination: string;
  budgetNote: string;
  hotels: HotelRecommendation[];
};

type JsonSchema = Record<string, unknown>;

type GeminiInteractionResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  steps?: Array<{ type?: string; content?: Array<{ text?: string; type?: string }> }>;
};

@Injectable()
export class AiPlannerService {
  private client: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private tripsService: TripsService,
    private audit: AuditService
  ) {
    this.client = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY') || 'missing-key' });
  }

  async generateTrip(userId: string, dto: GenerateTripDto) {
    let aiTrip: AiTrip;
    try {
      aiTrip = await this.requestJson<AiTrip>(this.tripPrompt(dto), this.tripSchema());
      await this.audit.logAi({ userId, provider: this.config.get<string>('GOOGLE_AI_API_KEY') ? 'Gemini' : 'OpenAI', action: 'GENERATE_TRIP', status: 'SUCCESS', model: this.config.get<string>('GOOGLE_AI_MODEL') || this.config.get<string>('OPENAI_MODEL') });
    } catch (error) {
      aiTrip = this.fallbackTrip(dto);
      await this.audit.logAi({ userId, provider: 'Fallback', action: 'GENERATE_TRIP', status: 'FALLBACK', error: error instanceof Error ? error.message : 'AI generation failed' });
    }

    const trip = await this.prisma.trip.create({
      data: {
        userId,
        title: aiTrip.tripTitle,
        destination: dto.destination,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        numberOfPeople: dto.numberOfPeople,
        totalBudget: dto.totalBudget,
        travelStyle: dto.travelStyle,
        summary: aiTrip.summary,
        budget: { create: aiTrip.budget },
        days: {
          create: aiTrip.days.map((day) => ({
            dayNumber: day.dayNumber,
            date: new Date(day.date),
            activities: { create: day.activities }
          }))
        }
      },
      include: this.tripsService.tripInclude()
    });
    await this.audit.log({ userId, action: 'CREATE_TRIP', entity: 'Trip', entityId: trip.id, metadata: { destination: dto.destination, source: 'AI' } });
    return trip;
  }

  async optimizeBudget(userId: string, dto: OptimizeBudgetDto) {
    await this.tripsService.assertOwner(userId, dto.tripId);
    const result = await this.requestJson<{
      status: 'optimized' | 'needs_major_changes';
      recommendations: Array<{ title: string; detail: string; estimatedSaving: number; category: string }>;
      revisedEstimatedCost: number;
    }>(this.optimizePrompt(dto), this.optimizeSchema());
    await this.audit.logAi({ userId, provider: this.config.get<string>('GOOGLE_AI_API_KEY') ? 'Gemini' : 'OpenAI', action: 'OPTIMIZE_BUDGET', status: 'SUCCESS' });
    return result;
  }

  async discover(dto: DiscoverPlacesDto) {
    try {
      const result = await this.requestJson<DiscoveryResponse>(this.discoveryPrompt(dto), this.discoverySchema());
      await this.audit.logAi({ provider: this.config.get<string>('GOOGLE_AI_API_KEY') ? 'Gemini' : 'OpenAI', action: 'DISCOVER', status: 'SUCCESS' });
      return result;
    } catch {
      await this.audit.logAi({ provider: 'Fallback', action: 'DISCOVER', status: 'FALLBACK' });
      return this.fallbackDiscovery(dto);
    }
  }

  async recommendHotels(dto: RecommendHotelsDto) {
    try {
      const result = await this.requestJson<HotelRecommendationResponse>(this.hotelPrompt(dto), this.hotelSchema());
      await this.audit.logAi({ provider: this.config.get<string>('GOOGLE_AI_API_KEY') ? 'Gemini' : 'OpenAI', action: 'RECOMMEND_HOTELS', status: 'SUCCESS' });
      return result;
    } catch {
      await this.audit.logAi({ provider: 'Fallback', action: 'RECOMMEND_HOTELS', status: 'FALLBACK' });
      return this.fallbackHotels(dto);
    }
  }

  private async requestJson<T>(prompt: string, schema: JsonSchema): Promise<T> {
    if (this.config.get<string>('GOOGLE_AI_API_KEY')) {
      return this.requestGeminiJson<T>(prompt, schema);
    }

    if (!this.config.get<string>('OPENAI_API_KEY')) {
      throw new BadRequestException('GOOGLE_AI_API_KEY or OPENAI_API_KEY is missing');
    }

    const response = await this.client.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: this.systemPrompt() },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new BadRequestException('AI returned an empty response');
    return JSON.parse(content) as T;
  }

  private async requestGeminiJson<T>(prompt: string, schema: JsonSchema): Promise<T> {
    const apiKey = this.config.getOrThrow<string>('GOOGLE_AI_API_KEY');
    const model = this.config.get<string>('GOOGLE_AI_MODEL') || 'gemini-2.5-flash';
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model,
        input: `${this.systemPrompt()}\n\n${prompt}`,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(`Gemini API error: ${errorText}`);
    }

    const data = (await response.json()) as GeminiInteractionResponse;
    const content =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.steps
        ?.find((step) => step.type === 'model_output')
        ?.content?.find((part) => part.type === 'text' || part.text)?.text;

    if (!content) throw new BadRequestException('Gemini returned an empty response');
    return JSON.parse(content) as T;
  }

  private tripPrompt(dto: GenerateTripDto) {
    return `Create a realistic travel plan in JSON only.
Input:
destination=${dto.destination}
startDate=${dto.startDate}
endDate=${dto.endDate}
numberOfDays=${dto.numberOfDays}
numberOfPeople=${dto.numberOfPeople}
totalBudget=${dto.totalBudget}
travelStyle=${dto.travelStyle}
note=${dto.note || '-'}

Rules:
- Return only this JSON shape: {"tripTitle":"","summary":"","days":[{"dayNumber":1,"date":"YYYY-MM-DD","activities":[{"time":"09:00","title":"","location":"","description":"","estimatedCost":0,"category":""}]}],"budget":{"accommodation":0,"food":0,"transportation":0,"activities":0,"shopping":0,"emergency":0,"totalEstimatedCost":0},"budgetStatus":"within_budget","savingTips":[]}
- Use Thai for summary, descriptions, and savingTips when natural.
- Create 3-5 activities per day, with reasonable travel time and not too crowded.
- Historical attractions must be <= 20% of all activities.
- Do not repeat attraction types on the same trip.
- Every day must feel different and exciting.
- Prioritize food experiences, street food tours, cafe hopping, local markets, shopping districts, scenic viewpoints, nightlife, entertainment, hidden gems, local experiences, nature, photography, wellness, and family-friendly options when they match the selected travel style.
- Include trending places, seasonal events, popular local experiences, hidden gems, famous restaurants, cafes, night markets, and shopping districts when relevant.
- Do not generate generic tourist itineraries; make the trip feel modern, realistic, and locally inspired.
- Costs are for all travelers combined.
- budgetStatus must be "within_budget" when totalEstimatedCost <= totalBudget, otherwise "over_budget".`;
  }

  private discoveryPrompt(dto: DiscoverPlacesDto) {
    const month = dto.startDate ? new Date(dto.startDate).toLocaleString('en-US', { month: 'long' }) : 'current season';
    return `Create AI-powered travel discovery recommendations in JSON only.
Input:
destination=${dto.destination}
travelMonth=${month}
travelStyle=${dto.travelStyle || 'balanced'}
totalBudget=${dto.totalBudget || 'not specified'}
numberOfPeople=${dto.numberOfPeople || 1}

Return exactly this shape:
{"trendingRightNow":[],"seasonalEvents":[],"recommendedForYou":[],"hiddenGems":[],"popularNearbyAttractions":[]}

Each array must contain 4 items. Each item:
{"name":"","category":"","trendScore":95,"estimatedBudget":800,"reason":"","shortDescription":"","imageHint":""}

Rules:
- Include trending attractions, popular cafes, famous restaurants, night markets, shopping districts, seasonal destinations, local events, and festivals.
- Generate trendScore from 70-99 using reviews, tourist popularity, seasonal relevance, and travel style relevance.
- estimatedBudget is per person in THB when destination is in Thailand; otherwise use local realistic equivalent but still return a number.
- Seasonal recommendations must depend on travel month. Examples: December Christmas markets/winter festivals, April Songkran, November Loy Krathong.
- Match travel style: Foodie means restaurants/markets/cafes; Nature means parks/viewpoints/waterfalls; Shopping means malls/markets/fashion districts.
- Make recommendations exciting, modern, realistic, and not generic.`;
  }

  private optimizePrompt(dto: OptimizeBudgetDto) {
    return `Optimize this travel budget and return JSON only.
Input:
tripId=${dto.tripId}
totalBudget=${dto.totalBudget}
totalEstimatedCost=${dto.totalEstimatedCost}
budgetBreakdown=${JSON.stringify(dto.budgetBreakdown || {})}

Return shape:
{"status":"optimized","recommendations":[{"title":"","detail":"","estimatedSaving":0,"category":""}],"revisedEstimatedCost":0}

Recommend practical ways to reduce accommodation, paid activities, transportation, and food costs.`;
  }

  private hotelPrompt(dto: RecommendHotelsDto) {
    return `Create smart hotel recommendations in JSON only.
Input:
destination=${dto.destination}
startDate=${dto.startDate || '-'}
endDate=${dto.endDate || '-'}
numberOfPeople=${dto.numberOfPeople || 1}
totalBudget=${dto.totalBudget || 'not specified'}
travelStyle=${dto.travelStyle || 'balanced'}
language=${dto.language || 'en'}
selectedAttractions=${dto.landmarks?.length ? dto.landmarks.join(', ') : 'not selected yet'}

Return exactly:
{"destination":"","budgetNote":"","hotels":[{"name":"","area":"","category":"Best Value","estimatedNightlyPrice":1500,"rating":4.5,"fitFor":"","distanceToHighlights":"","reason":"","imageHint":""}]}

Rules:
- Return 5 hotel or stay recommendations.
- Use categories: Budget Stay, Best Value, Near Attractions, Family Friendly, Luxury Pick.
- estimatedNightlyPrice is an estimated nightly price in THB.
- Use Thai for budgetNote, fitFor, distanceToHighlights, and reason when language=th.
- Do not claim real-time availability or exact price.
- If selectedAttractions are provided, prioritize hotel areas near those places and explain proximity in distanceToHighlights.
- Recommend realistic areas and hotel-style names that fit destination, selected attractions, budget, travelers, and travel style.
- Explain why each stay fits the trip and how it affects the budget.`;
  }

  private fallbackHotels(dto: RecommendHotelsDto): HotelRecommendationResponse {
    const destination = dto.destination || 'Bangkok';
    const budget = Number(dto.totalBudget || 15000);
    const nightlyBase = Math.max(900, Math.round((budget * 0.28) / 3));
    const landmarks = dto.landmarks?.filter(Boolean).slice(0, 3) || [];
    const landmarkText = landmarks.length ? landmarks.join(', ') : 'popular highlights';
    const nearArea = landmarks[0] ? `Near ${landmarks[0]}` : 'Central neighborhood';
    const th = dto.language === 'th';
    return {
      destination,
      budgetNote: landmarks.length
        ? th ? `แนะนำที่พักใกล้: ${landmarkText} ราคาเป็นเพียงประมาณการต่อคืน ควรตรวจสอบราคาจริงก่อนจอง` : `Estimated stays near: ${landmarkText}. Prices are nightly estimates only; check live availability before booking.`
        : th ? 'ราคาเป็นเพียงประมาณการต่อคืน เพิ่มสถานที่เที่ยวเพื่อให้ระบบแนะนำที่พักใกล้จุดที่คุณเลือกมากขึ้น' : 'Estimated nightly prices only. Add attractions to get stays closer to your selected places.',
      hotels: [
        {
          name: `${destination} Local Comfort Hotel`,
          area: nearArea,
          category: 'Best Value',
          estimatedNightlyPrice: nightlyBase,
          rating: 4.5,
          fitFor: th ? 'คนที่อยากได้ที่พักสบายในงบไม่แรงเกินไป' : 'Travelers who want comfort without burning the trip budget.',
          distanceToHighlights: landmarks.length ? th ? `ประมาณ 10-15 นาทีจากโซน ${landmarkText}` : `10-15 minutes around ${landmarkText}.` : th ? 'ประมาณ 10-20 นาทีจากโซนอาหารและคาเฟ่ยอดนิยม' : '10-20 minutes to popular food and cafe areas.',
          reason: landmarks.length ? th ? 'ทำเลสมดุล ราคาเหมาะ และใกล้สถานที่ที่คุณเลือก ช่วยลดเวลาเดินทาง' : 'Balanced price and close enough to your selected attractions to reduce travel time.' : th ? 'ราคาและทำเลกำลังดี เชื่อมกับเส้นทางเที่ยวรายวันได้ง่าย' : 'Balanced price, convenient area, and easy to combine with daily itinerary routes.',
          imageHint: 'modern city hotel room'
        },
        {
          name: `${destination} Budget Smart Stay`,
          area: 'Transit-friendly area',
          category: 'Budget Stay',
          estimatedNightlyPrice: Math.max(650, Math.round(nightlyBase * 0.68)),
          rating: 4.1,
          fitFor: th ? 'คนที่อยากประหยัดงบที่พักหรือพักระยะสั้น' : 'Budget-conscious travelers and short stays.',
          distanceToHighlights: landmarks.length ? th ? `เดินทางต่อไปยัง ${landmarkText} ได้สะดวก` : `Transit access toward ${landmarkText}.` : th ? 'ใกล้ระบบขนส่งหรือถนนหลัก' : 'Near public transport or main road access.',
          reason: th ? 'ช่วยลดงบที่พัก เพื่อเหลืองบไว้กิน เที่ยว และช้อปมากขึ้น' : 'Keeps accommodation spend low so more budget can go to food, activities, and shopping.',
          imageHint: 'compact budget hotel'
        },
        {
          name: `${destination} Old Town Boutique`,
          area: landmarks[1] ? `Between ${landmarks[0]} and ${landmarks[1]}` : 'Walkable local district',
          category: 'Near Attractions',
          estimatedNightlyPrice: Math.round(nightlyBase * 1.15),
          rating: 4.4,
          fitFor: th ? 'สายคาเฟ่ ถ่ายรูป กินร้านดัง และคนมาเที่ยวครั้งแรก' : 'Cafe hopping, photography, food routes, and first-time visitors.',
          distanceToHighlights: landmarks.length ? th ? `เหมาะกับการเดินทางเร็วไปยัง ${landmarkText}` : `Designed around quick access to ${landmarkText}.` : th ? 'เดินถึงร้านอาหาร คาเฟ่ และจุดเที่ยวช่วงเย็นได้ง่าย' : 'Walkable to local restaurants, cafes, and evening spots.',
          reason: landmarks.length ? th ? 'เหมาะเมื่ออยากพักใกล้กลุ่มสถานที่เที่ยวที่วางไว้' : 'Best pick when you want the stay to sit close to your planned sightseeing cluster.' : th ? 'ทำเลช่วยลดเวลาเดินทางและทำให้ทริปลื่นขึ้น' : 'The location reduces transport time and makes the itinerary feel smoother.',
          imageHint: 'boutique hotel street'
        },
        {
          name: `${destination} Family Base Residence`,
          area: 'Quiet residential zone',
          category: 'Family Friendly',
          estimatedNightlyPrice: Math.round(nightlyBase * 1.25),
          rating: 4.3,
          fitFor: th ? 'ครอบครัว กลุ่มเพื่อน หรือคนที่ต้องการพื้นที่กว้างขึ้น' : 'Families, groups, or travelers who need more room.',
          distanceToHighlights: th ? 'นั่งรถไม่นานไปยังสถานที่เที่ยวหลักและห้าง' : 'Short taxi ride to main attractions and malls.',
          reason: th ? 'ห้องกว้างและโซนเงียบกว่า ช่วยให้ทริปพักผ่อนสบายขึ้น' : 'Larger rooms and quieter surroundings help keep the trip comfortable.',
          imageHint: 'family hotel suite'
        },
        {
          name: `${destination} Skyline Escape`,
          area: 'Premium scenic zone',
          category: 'Luxury Pick',
          estimatedNightlyPrice: Math.round(nightlyBase * 2.1),
          rating: 4.7,
          fitFor: th ? 'คู่รัก โอกาสพิเศษ หรือทริปพักผ่อนแบบพรีเมียม' : 'Couples, special occasions, and premium weekend escapes.',
          distanceToHighlights: th ? 'ใกล้ร้านอาหารวิวสวย จุดชมวิว และโซนกลางคืน' : 'Close to rooftop dining, scenic views, and nightlife.',
          reason: th ? 'ตัวเลือกพรีเมียมสำหรับคนที่อยากให้ที่พักเป็นส่วนหนึ่งของประสบการณ์ทริป' : 'A premium stay option for users who want the hotel to become part of the experience.',
          imageHint: 'luxury hotel skyline'
        }
      ]
    };
  }

  private systemPrompt() {
    return `You are an expert travel planner.

Create a fun, diverse, realistic, and enjoyable itinerary.

Do NOT focus mainly on historical attractions.

Create balanced travel experiences using:

* Food experiences
* Cafe hopping
* Local markets
* Shopping districts
* Nightlife
* Scenic viewpoints
* Nature attractions
* Hidden gems
* Local experiences
* Entertainment
* Photography spots
* Cultural attractions

Historical attractions should not exceed 20 percent.

Avoid repeating similar activities.

Prioritize experiences that tourists genuinely enjoy.

Match the user's travel style.

Respect the user's budget.

Return valid JSON only.

The itinerary should feel like it was created by a professional travel consultant, not a history teacher.`;
  }

  private fallbackDiscovery(dto: DiscoverPlacesDto): DiscoveryResponse {
    const destination = dto.destination || 'Bangkok';
    const base = (name: string, category: string, trendScore: number, estimatedBudget: number, reason: string, imageHint: string): DiscoveryPlace => ({
      name,
      category,
      trendScore,
      estimatedBudget,
      reason,
      shortDescription: reason,
      imageHint
    });
    return {
      trendingRightNow: [
        base('Jodd Fairs Night Market', 'Night Market', 95, 800, 'Highly popular for street food, nightlife, and local experiences.', 'night market street food'),
        base(`${destination} Cafe Hopping District`, 'Cafe', 89, 600, 'A photogenic cafe area that fits relaxed daytime discovery.', 'modern cafe travel'),
        base(`${destination} Riverside Walk`, 'Scenic Viewpoint', 86, 500, 'A scenic evening stop with food, views, and photo moments.', 'riverside city sunset'),
        base(`${destination} Fashion & Shopping Quarter`, 'Shopping District', 84, 1200, 'Good for local brands, souvenirs, and casual dining.', 'shopping district travel')
      ],
      seasonalEvents: [
        base('Seasonal Food Festival', 'Festival', 90, 700, 'A seasonal event that adds local flavor and energy to the trip.', 'food festival'),
        base('Local Weekend Market', 'Local Market', 88, 600, 'Great for discovering snacks, crafts, and neighborhood culture.', 'local weekend market'),
        base('City Light Festival', 'Local Event', 82, 500, 'A lively evening experience with photo-friendly installations.', 'city lights festival'),
        base('Cultural Pop-up Fair', 'Festival', 78, 400, 'A light cultural stop without making the trip history-heavy.', 'outdoor cultural fair')
      ],
      recommendedForYou: [
        base('Michelin Local Eats Route', 'Food Experience', 94, 1000, 'A food-focused route for travelers who want memorable local meals.', 'local restaurant food'),
        base('Hidden Cafe Lane', 'Cafe Hopping', 87, 500, 'A stylish cafe route with photography-friendly corners.', 'hidden cafe lane'),
        base('Creative Nightlife Street', 'Nightlife', 83, 1200, 'A modern evening area with bars, music, and late-night food.', 'nightlife street'),
        base('Wellness Morning Stop', 'Wellness', 76, 900, 'A slower morning option for balance and recovery.', 'wellness spa morning')
      ],
      hiddenGems: [
        base('Neighborhood Art Alley', 'Hidden Gem', 85, 300, 'A local-feeling place for photos, street art, and small cafes.', 'street art alley'),
        base('Secret Viewpoint Cafe', 'Hidden Gem', 82, 650, 'Combines views, coffee, and a quieter break from busy areas.', 'viewpoint cafe'),
        base('Local Dessert Shop', 'Hidden Gem', 80, 250, 'A small stop that adds local sweetness to the itinerary.', 'local dessert shop'),
        base('Indie Craft Market', 'Hidden Gem', 78, 700, 'Good for unique souvenirs and local maker culture.', 'indie craft market')
      ],
      popularNearbyAttractions: [
        base('Central Shopping Hub', 'Shopping District', 88, 1500, 'Convenient, popular, and easy to combine with cafes and dinner.', 'shopping mall'),
        base('Urban Park & Picnic Lawn', 'Nature', 84, 300, 'A refreshing nature break inside the city.', 'urban park picnic'),
        base('Rooftop Sunset Spot', 'Scenic Viewpoint', 91, 1000, 'A premium sunset experience with strong photo appeal.', 'rooftop sunset'),
        base('Family Entertainment Complex', 'Entertainment', 79, 900, 'Useful for families or rainy-day flexibility.', 'family entertainment')
      ]
    };
  }

  private fallbackTrip(dto: GenerateTripDto): AiTrip {
    const styles = dto.travelStyle.toLowerCase();
    const destination = dto.destination;
    const start = new Date(dto.startDate);
    const dayTemplates = [
      [
        ['09:00', 'Local breakfast and cafe hopping', 'food', 450],
        ['11:00', 'Creative neighborhood photo walk', 'photography', 200],
        ['14:00', 'Local market and hidden snack stops', 'local market', 600],
        ['18:30', 'Night market street food experience', 'night market', 900]
      ],
      [
        ['09:30', 'Scenic viewpoint or riverside walk', 'scenic', 250],
        ['12:00', 'Famous local restaurant lunch', 'food', 700],
        ['15:00', 'Shopping district and local brands', 'shopping', 1200],
        ['19:30', 'Entertainment district or live music', 'entertainment', 1000]
      ],
      [
        ['10:00', styles.includes('nature') ? 'Nature park and easy walking trail' : 'Hidden cafe lane and dessert shop', styles.includes('nature') ? 'nature' : 'cafe', 500],
        ['13:00', 'Neighborhood cultural stop without overloading history', 'culture', 350],
        ['16:00', 'Wellness break or slow local experience', 'wellness', 800],
        ['18:30', 'Sunset dinner spot with city atmosphere', 'food', 1000]
      ]
    ];

    const days = Array.from({ length: dto.numberOfDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const template = dayTemplates[index % dayTemplates.length];
      return {
        dayNumber: index + 1,
        date: date.toISOString().slice(0, 10),
        activities: template.map(([time, title, category, cost]) => ({
          time: String(time),
          title: String(title),
          location: destination,
          description: `A practical ${category} experience in ${destination}, selected to keep the trip varied, modern, and budget-aware.`,
          category: String(category),
          estimatedCost: Number(cost) * dto.numberOfPeople
        }))
      };
    });

    const activitiesTotal = days.reduce(
      (sum, day) => sum + day.activities.reduce((daySum, activity) => daySum + activity.estimatedCost, 0),
      0
    );
    const accommodation = Math.round(dto.totalBudget * 0.32);
    const transportation = Math.round(dto.totalBudget * 0.12);
    const food = Math.round(activitiesTotal * 0.45);
    const shopping = styles.includes('shopping') ? Math.round(dto.totalBudget * 0.12) : Math.round(dto.totalBudget * 0.06);
    const emergency = Math.round(dto.totalBudget * 0.05);
    const totalEstimatedCost = accommodation + transportation + food + activitiesTotal + shopping + emergency;

    return {
      tripTitle: `${destination} ${dto.numberOfDays} Days Smart Trip`,
      summary: `แผนเที่ยว ${destination} ${dto.numberOfDays} วัน เน้นประสบการณ์หลากหลาย ทั้งอาหาร คาเฟ่ ตลาดท้องถิ่น จุดถ่ายรูป และกิจกรรมร่วมสมัย โดยลดความซ้ำของสถานที่ท่องเที่ยวแบบทั่วไป`,
      days,
      budget: {
        accommodation,
        food,
        transportation,
        activities: activitiesTotal,
        shopping,
        emergency,
        totalEstimatedCost
      },
      budgetStatus: totalEstimatedCost <= dto.totalBudget ? 'within_budget' : 'over_budget',
      savingTips: [
        'เลือกโซนที่พักใกล้ระบบขนส่งหรือย่านกิจกรรมหลัก',
        'จัดคาเฟ่ ตลาด และจุดถ่ายรูปในโซนเดียวกันเพื่อลดค่าเดินทาง',
        'เผื่องบฉุกเฉินไว้เสมอและจองกิจกรรมที่มีราคาชัดเจนล่วงหน้า'
      ]
    };
  }

  private tripSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        tripTitle: { type: 'string' },
        summary: { type: 'string' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayNumber: { type: 'integer' },
              date: { type: 'string' },
              activities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'string' },
                    title: { type: 'string' },
                    location: { type: 'string' },
                    description: { type: 'string' },
                    estimatedCost: { type: 'number' },
                    category: { type: 'string' }
                  },
                  required: ['time', 'title', 'location', 'description', 'estimatedCost', 'category']
                }
              }
            },
            required: ['dayNumber', 'date', 'activities']
          }
        },
        budget: {
          type: 'object',
          properties: {
            accommodation: { type: 'number' },
            food: { type: 'number' },
            transportation: { type: 'number' },
            activities: { type: 'number' },
            shopping: { type: 'number' },
            emergency: { type: 'number' },
            totalEstimatedCost: { type: 'number' }
          },
          required: ['accommodation', 'food', 'transportation', 'activities', 'shopping', 'emergency', 'totalEstimatedCost']
        },
        budgetStatus: { type: 'string', enum: ['within_budget', 'over_budget'] },
        savingTips: { type: 'array', items: { type: 'string' } }
      },
      required: ['tripTitle', 'summary', 'days', 'budget', 'budgetStatus', 'savingTips']
    };
  }

  private optimizeSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['optimized', 'needs_major_changes'] },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              detail: { type: 'string' },
              estimatedSaving: { type: 'number' },
              category: { type: 'string' }
            },
            required: ['title', 'detail', 'estimatedSaving', 'category']
          }
        },
        revisedEstimatedCost: { type: 'number' }
      },
      required: ['status', 'recommendations', 'revisedEstimatedCost']
    };
  }

  private discoverySchema(): JsonSchema {
    const place = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        trendScore: { type: 'integer' },
        estimatedBudget: { type: 'number' },
        reason: { type: 'string' },
        shortDescription: { type: 'string' },
        imageHint: { type: 'string' }
      },
      required: ['name', 'category', 'trendScore', 'estimatedBudget', 'reason', 'shortDescription', 'imageHint']
    };
    return {
      type: 'object',
      properties: {
        trendingRightNow: { type: 'array', items: place },
        seasonalEvents: { type: 'array', items: place },
        recommendedForYou: { type: 'array', items: place },
        hiddenGems: { type: 'array', items: place },
        popularNearbyAttractions: { type: 'array', items: place }
      },
      required: ['trendingRightNow', 'seasonalEvents', 'recommendedForYou', 'hiddenGems', 'popularNearbyAttractions']
    };
  }

  private hotelSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        budgetNote: { type: 'string' },
        hotels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              area: { type: 'string' },
              category: { type: 'string', enum: ['Budget Stay', 'Best Value', 'Near Attractions', 'Family Friendly', 'Luxury Pick'] },
              estimatedNightlyPrice: { type: 'number' },
              rating: { type: 'number' },
              fitFor: { type: 'string' },
              distanceToHighlights: { type: 'string' },
              reason: { type: 'string' },
              imageHint: { type: 'string' }
            },
            required: ['name', 'area', 'category', 'estimatedNightlyPrice', 'rating', 'fitFor', 'distanceToHighlights', 'reason', 'imageHint']
          }
        }
      },
      required: ['destination', 'budgetNote', 'hotels']
    };
  }
}
