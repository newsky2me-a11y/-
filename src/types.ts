export interface CityRecommendation {
  name: string;
  country: string;
  tagline: string;
  foodHighlight: string;
  recommendedBudget: string;
  bestVisitingReason: string;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  currentWeather: string;
  imageTheme: string;
}

export interface TravelPlanInput {
  destination: string;
  durationDays: number;
  travelStyle: 'gourmet' | 'budget' | 'balanced' | 'leisure';
  budgetTier: 'economy' | 'moderate' | 'premium';
}

export interface BudgetBreakdown {
  flight: number;
  lodging: number;
  food: number;
  activity: number;
  currencySymbol: string;
}

export interface ItinerarySpot {
  spotName: string;
  category: 'food' | 'lodging' | 'activity' | 'transport';
  description: string;
  optimalTime: string;
  costEstimate: number;
  dilemmaSolved: string; // Resolves typical worries (e.g., "avoid waiting in line", "delicious and cheap")
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  weatherCondition: 'Sunny' | 'Rainy' | 'Cloudy' | 'Windy';
  crowdLevel: 'Low' | 'Moderate' | 'High';
  spots: ItinerarySpot[];
  routingTip: string;
}

export interface ChecklistItem {
  id: string; // unique identifier
  item: string;
  category: 'essential' | 'foodie' | 'clothing' | 'documents';
  whyNeeded: string;
  checked: boolean;
}

export interface FlightDeal {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  dealPrice: number;
  averagePrice: number;
  discountRate: number;
  validUntil: string;
  reason: string;
}

export interface TravelPlanResponse {
  cityName: string;
  tagline: string;
  budgetBreakdown: BudgetBreakdown;
  routeOverview: string;
  itinerary: ItineraryDay[];
  checklist: ChecklistItem[];
}
