'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'th';

const dictionary = {
  en: {
    brand: 'AI Smart Travel Planner',
    tagline: 'Plan Smarter. Travel Better.',
    workspace: 'Workspace',
    nextDestination: 'Your next destination',
    search: 'Search trips, destinations, budgets...',
    noActiveTrip: 'No active trip',
    traveler: 'Traveler',
    logout: 'Logout',
    navDashboard: 'Dashboard',
    navTrips: 'My Trips',
    navCreate: 'Create Trip',
    navSaved: 'Saved Places',
    navBudget: 'Budget Overview',
    navExpenses: 'Expenses',
    navReports: 'Reports & Analytics',
    navAssistant: 'AI Assistant',
    navGuide: 'Travel Guide',
    navAdmin: 'Admin',
    navAdminDashboard: 'Admin Dashboard',
    navAdminUsers: 'Users',
    navAdminTrips: 'All Trips',
    navAdminAnalytics: 'Analytics',
    dashboardEyebrow: 'Plan Smarter. Travel Better.',
    dashboardTitle: 'Your AI travel command center.',
    dashboardSubtitle: 'Build richer itineraries, monitor budget health, and turn every destination into a polished travel plan.',
    aiRecommendation: 'AI Recommendation',
    aiRecommendationText: 'Add one local market, one cafe, and one scenic evening stop to make the next itinerary feel more balanced.',
    createTrip: 'Create Trip',
    totalTrips: 'Total Trips',
    budgetUsage: 'Budget Usage',
    savedPlaces: 'Saved Places',
    aiRecommendations: 'AI Recommendations',
    expenseTrends: 'Expense Trends',
    expenseTrendsDesc: 'Planned budget vs actual spending by recent trip.',
    budgetBreakdown: 'Budget Breakdown',
    recentTrips: 'Recent Trips',
    upcomingTrips: 'Upcoming Trips',
    noTrips: 'No trips yet. Create your first AI-powered itinerary.',
    createEyebrow: 'AI itinerary studio',
    createTitle: 'Design a trip that feels curated, balanced, and alive.',
    createSubtitle: 'Tell the planner your destination, timing, budget, and travel personality. The AI will create a diverse itinerary with food, markets, hidden gems, viewpoints, and local experiences.',
    preview: 'Preview intelligence',
    destination: 'Destination',
    startDate: 'Start Date',
    endDate: 'End Date',
    numberOfDays: 'Number of Days',
    numberOfPeople: 'Number of People',
    totalBudget: 'Total Budget',
    travelStyle: 'Travel Style',
    additionalNotes: 'Additional Notes',
    notesPlaceholder: 'Tell AI about must-visit places, dietary needs, hotel area, pace, accessibility, or things to avoid.',
    generateTrip: 'Generate My Trip with AI',
    generating: 'Crafting your itinerary...',
    aiError: 'AI generation failed. Check your Gemini/OpenAI API key, backend status, and trip details.',
    tripsTitle: 'Trips',
    viewDetail: 'View detail',
    loadingTrip: 'Loading your trip workspace...',
    travelers: 'travelers',
    curatedActivities: 'curated activities',
    edit: 'Edit',
    delete: 'Delete',
    budget: 'Budget',
    expenses: 'Expenses',
    regenerate: 'Regenerate Trip',
    aiSummary: 'AI Summary',
    aiInsights: 'AI Insights',
    timeline: 'Day-by-Day Timeline',
    totalBudgetLabel: 'Total Budget',
    estimatedCosts: 'Estimated Costs',
    actualSpent: 'Actual Spent',
    budgetStatus: 'Budget Status',
    needsOptimization: 'Needs optimization',
    onTrack: 'On track',
    estimatedBudgetUsage: 'Estimated budget usage',
    addActivity: 'Add Activity',
    saveActivity: 'Save Activity',
    day: 'Day',
    time: 'Time',
    cost: 'Cost',
    title: 'Title',
    location: 'Location',
    description: 'Description',
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name'
  },
  th: {
    brand: 'AI Smart Travel Planner',
    tagline: 'วางแผนฉลาดขึ้น เที่ยวได้ดีกว่าเดิม',
    workspace: 'พื้นที่ทำงาน',
    nextDestination: 'จุดหมายถัดไปของคุณ',
    search: 'ค้นหาทริป จุดหมาย หรืองบประมาณ...',
    noActiveTrip: 'ยังไม่มีทริปที่ใช้งาน',
    traveler: 'นักเดินทาง',
    logout: 'ออกจากระบบ',
    navDashboard: 'แดชบอร์ด',
    navTrips: 'ทริปของฉัน',
    navCreate: 'สร้างทริป',
    navSaved: 'สถานที่บันทึก',
    navBudget: 'ภาพรวมงบประมาณ',
    navExpenses: 'ค่าใช้จ่าย',
    navReports: 'รายงานและสถิติ',
    navAssistant: 'ผู้ช่วย AI',
    navGuide: 'คู่มือท่องเที่ยว',
    navAdmin: 'ผู้ดูแลระบบ',
    navAdminDashboard: 'แดชบอร์ดผู้ดูแล',
    navAdminUsers: 'ผู้ใช้',
    navAdminTrips: 'ทริปทั้งหมด',
    navAdminAnalytics: 'วิเคราะห์ข้อมูล',
    dashboardEyebrow: 'วางแผนฉลาดขึ้น เที่ยวได้ดีกว่าเดิม',
    dashboardTitle: 'ศูนย์ควบคุมการเดินทางด้วย AI',
    dashboardSubtitle: 'สร้างแผนเที่ยวที่ครบขึ้น ติดตามงบประมาณ และเปลี่ยนทุกจุดหมายให้เป็นทริปที่พร้อมเดินทาง',
    aiRecommendation: 'คำแนะนำจาก AI',
    aiRecommendationText: 'เพิ่มตลาดท้องถิ่น คาเฟ่ และจุดชมวิวช่วงเย็น เพื่อให้แผนทริปสมดุลและน่าสนใจขึ้น',
    createTrip: 'สร้างทริป',
    totalTrips: 'จำนวนทริปทั้งหมด',
    budgetUsage: 'การใช้งบประมาณ',
    savedPlaces: 'สถานที่บันทึก',
    aiRecommendations: 'คำแนะนำ AI',
    expenseTrends: 'แนวโน้มค่าใช้จ่าย',
    expenseTrendsDesc: 'เปรียบเทียบงบที่วางไว้กับค่าใช้จ่ายจริงในทริปล่าสุด',
    budgetBreakdown: 'งบประมาณตามหมวดหมู่',
    recentTrips: 'ทริปล่าสุด',
    upcomingTrips: 'ทริปที่กำลังจะมาถึง',
    noTrips: 'ยังไม่มีทริป เริ่มสร้างแผนเที่ยวด้วย AI ได้เลย',
    createEyebrow: 'สตูดิโอสร้างแผนเที่ยวด้วย AI',
    createTitle: 'ออกแบบทริปที่คัดสรรอย่างดี สมดุล และมีชีวิตชีวา',
    createSubtitle: 'บอกจุดหมาย เวลา งบประมาณ และสไตล์การเที่ยว แล้ว AI จะสร้างแผนที่หลากหลาย ทั้งอาหาร ตลาด คาเฟ่ จุดชมวิว และประสบการณ์ท้องถิ่น',
    preview: 'ตัวอย่างข้อมูลอัจฉริยะ',
    destination: 'จุดหมายปลายทาง',
    startDate: 'วันที่เริ่มต้น',
    endDate: 'วันที่สิ้นสุด',
    numberOfDays: 'จำนวนวัน',
    numberOfPeople: 'จำนวนคน',
    totalBudget: 'งบประมาณรวม',
    travelStyle: 'สไตล์การเที่ยว',
    additionalNotes: 'หมายเหตุเพิ่มเติม',
    notesPlaceholder: 'บอก AI เกี่ยวกับสถานที่ที่อยากไป อาหารที่เลี่ยง โซนที่พัก ความเร็วในการเที่ยว หรือสิ่งที่ไม่ต้องการ',
    generateTrip: 'สร้างทริปของฉันด้วย AI',
    generating: 'กำลังสร้างแผนเที่ยว...',
    aiError: 'สร้างทริปไม่สำเร็จ กรุณาตรวจสอบ API key, backend และข้อมูลทริป',
    tripsTitle: 'ทริป',
    viewDetail: 'ดูรายละเอียด',
    loadingTrip: 'กำลังโหลดพื้นที่ทำงานทริป...',
    travelers: 'คน',
    curatedActivities: 'กิจกรรมที่คัดสรร',
    edit: 'แก้ไข',
    delete: 'ลบ',
    budget: 'งบประมาณ',
    expenses: 'ค่าใช้จ่าย',
    regenerate: 'สร้างใหม่',
    aiSummary: 'สรุปจาก AI',
    aiInsights: 'ข้อมูลเชิงลึกจาก AI',
    timeline: 'ไทม์ไลน์รายวัน',
    totalBudgetLabel: 'งบประมาณรวม',
    estimatedCosts: 'ค่าใช้จ่ายคาดการณ์',
    actualSpent: 'ใช้จริง',
    budgetStatus: 'สถานะงบประมาณ',
    needsOptimization: 'ควรปรับงบ',
    onTrack: 'อยู่ในแผน',
    estimatedBudgetUsage: 'สัดส่วนงบประมาณที่คาดว่าจะใช้',
    addActivity: 'เพิ่มกิจกรรม',
    saveActivity: 'บันทึกกิจกรรม',
    day: 'วันที่',
    time: 'เวลา',
    cost: 'ค่าใช้จ่าย',
    title: 'ชื่อ',
    location: 'สถานที่',
    description: 'รายละเอียด',
    welcomeBack: 'ยินดีต้อนรับกลับ',
    createAccount: 'สร้างบัญชี',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    name: 'ชื่อ'
  }
} as const;

type DictionaryKey = keyof typeof dictionary.en;
type Dictionary = Record<DictionaryKey, string>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'th') setLanguageState(saved);
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    localStorage.setItem('language', nextLanguage);
  }

  const value = useMemo(() => ({ language, setLanguage, t: dictionary[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
