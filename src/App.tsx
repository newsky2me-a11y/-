import React, { useState, useEffect } from "react";
import { 
  Plane, 
  Hotel, 
  Utensils, 
  Compass, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CloudSun, 
  CloudRain,
  Sun,
  Users, 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  MapPin, 
  TrendingDown, 
  ChevronRight, 
  Calendar, 
  ArrowRight, 
  HelpCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  CheckCircle2,
  Info
} from "lucide-react";
import { 
  CityRecommendation, 
  TravelPlanInput, 
  TravelPlanResponse, 
  FlightDeal, 
  ChecklistItem,
  ItineraryDay
} from "./types";

export default function App() {
  // Recommendation state
  const [recommendations, setRecommendations] = useState<CityRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Flight deals state
  const [flightDeals, setFlightDeals] = useState<FlightDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);

  // Active travel planner state
  const [userInput, setUserInput] = useState<TravelPlanInput>({
    destination: "후쿠오카 (Fukuoka)",
    durationDays: 3,
    travelStyle: "gourmet",
    budgetTier: "moderate"
  });
  const [activePlan, setActivePlan] = useState<TravelPlanResponse | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);

  // Quick prompt string (top bar query)
  const [quickQuery, setQuickQuery] = useState("후쿠오카 3일 최고의 먹방 여행 짜줘");

  // Weather adjustment/instruction state
  const [adjustmentInstruction, setAdjustmentInstruction] = useState("");
  const [adjustingPlan, setAdjustingPlan] = useState(false);

  // Manual checklist addition state
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState<'essential' | 'foodie' | 'clothing' | 'documents'>('foodie');

  // Load recommendations and deals on mount
  useEffect(() => {
    fetchRecommendations();
    fetchFlightDeals();
    generateItinerary("후쿠오카 (Fukuoka)");
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const res = await fetch("/api/recommend-cities");
      if (!res.ok) throw new Error("Failed to load recommendations");
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchFlightDeals = async () => {
    try {
      setLoadingDeals(true);
      const res = await fetch("/api/flight-deals");
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      setFlightDeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeals(false);
    }
  };

  // Generate complete itinerary using input params or custom destination name
  const generateItinerary = async (destinationToUse?: string) => {
    try {
      setGeneratingPlan(true);
      setErrorPlan(null);
      const targetDest = destinationToUse || userInput.destination;
      
      const payload = {
        destination: targetDest,
        durationDays: userInput.durationDays,
        travelStyle: userInput.travelStyle,
        budgetTier: userInput.budgetTier
      };

      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("AI 플랜 서비스와 통신하는 도중 지연이 발생했습니다. 다시 빌드해 주십시오.");
      const data = await res.json();
      setActivePlan(data);
    } catch (err: any) {
      setErrorPlan(err.message || "오류가 발생했습니다.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Adjust Plan dynamically based on user weather/congestion commands
  const adjustItinerary = async () => {
    if (!activePlan || !adjustmentInstruction.trim()) return;
    try {
      setAdjustingPlan(true);
      setErrorPlan(null);
      
      const res = await fetch("/api/adjust-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPlan: activePlan,
          requestInstruction: adjustmentInstruction
        })
      });

      if (!res.ok) throw new Error("일정 조정에 실패했습니다.");
      const data = await res.json();
      setActivePlan(data);
      setAdjustmentInstruction(""); // Clear instructions on success
    } catch (err: any) {
      setErrorPlan(`수정 요청 처리 중 실패: ${err.message}`);
    } finally {
      setAdjustingPlan(false);
    }
  };

  // Top Bar Quick Prompt Action
  const handleQuickPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    
    // Parse quickQuery as destination roughly
    setUserInput(prev => ({
      ...prev,
      destination: quickQuery
    }));
    generateItinerary(quickQuery);
  };

  // Utility to handle selecting a recommended city
  const selectRecommendedCity = (city: CityRecommendation) => {
    setUserInput(prev => ({
      ...prev,
      destination: city.name
    }));
    generateItinerary(city.name);
  };

  // Support direct click to book/activate flight deals
  const selectFlightDeal = (deal: FlightDeal) => {
    setUserInput(prev => ({
      ...prev,
      destination: deal.destination + " (" + deal.carrier + " 특가)"
    }));
    generateItinerary(deal.destination);
  };

  // Toggle checklist status
  const toggleChecklistItem = (id: string) => {
    if (!activePlan) return;
    const updatedList = activePlan.checklist.map(item => {
      if (item.id === id) return { ...item, checked: !item.checked };
      return item;
    });
    setActivePlan({
      ...activePlan,
      checklist: updatedList
    });
  };

  // Add item manually to travel checklist
  const addManualChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !activePlan) return;

    const newItem: ChecklistItem = {
      id: `manual-${Date.now()}`,
      item: newChecklistItem.trim(),
      category: newChecklistCategory,
      whyNeeded: "여행자가 직접 설정해 잊지 말아야 하는 개인 필수 귀중품",
      checked: false
    };

    setActivePlan({
      ...activePlan,
      checklist: [...activePlan.checklist, newItem]
    });
    setNewChecklistItem("");
  };

  // Remove checklist item
  const removeChecklistItem = (id: string) => {
    if (!activePlan) return;
    setActivePlan({
      ...activePlan,
      checklist: activePlan.checklist.filter(item => item.id !== id)
    });
  };

  // Helper formatter for money
  const formatMoney = (val: number) => {
    return val.toLocaleString() + "₩";
  };

  // Calculate total budget recommendation
  const calculateTotalBudget = () => {
    if (!activePlan) return 0;
    const { flight, lodging, food, activity } = activePlan.budgetBreakdown;
    return flight + lodging + food + activity;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      
      {/* HEADER NAVIGATION */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-800 block">AI TRAVEL PLANNER</span>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider block">Geometric Balance</span>
          </div>
        </div>

        {/* Dynamic Search/Query generator */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <form onSubmit={handleQuickPlan} className="relative">
            <input 
              type="text" 
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="예: '방콕 4일 예산 100만원 미식 코스' 또는 임의의 도시 입력..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-28 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>즉시 추천</span>
            </button>
          </form>
        </div>

        {/* User Info / Context indicator */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">CURRENT POSITION</p>
            <p className="text-xs font-extrabold text-slate-700 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Seoul, KR
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=150&h=150&q=80" alt="airplane profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT GRID */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-x-hidden">
        
        {/* LEFT COLUMN: Recommendations & Alerts (col-span-3) */}
        <section className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Weather/Season City Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seasonal Best</h3>
                <h2 className="text-base font-bold text-slate-800 mt-0.5">🗓️ 6월 최적 추천 여행지</h2>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">미식 특화</span>
            </div>

            {loadingRecommendations ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">실시간 기상/미식 데이터 분석 중...</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recommendations.map((city) => (
                  <div 
                    key={city.name}
                    onClick={() => selectRecommendedCity(city)}
                    className="group border border-slate-100 p-3.5 rounded-xl hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-bold">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>{city.country}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors">
                          {city.name}
                        </h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        city.crowdLevel === 'High' ? 'bg-red-50 text-red-600' :
                        city.crowdLevel === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        혼잡 {city.crowdLevel === 'High' ? '상' : city.crowdLevel === 'Moderate' ? '중' : '여유'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {city.tagline}
                    </p>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 bg-slate-50 group-hover:bg-blue-50 px-1.5 py-0.5 rounded">
                        🥩 {city.foodHighlight.split(',')[0]}
                      </span>
                      <span className="text-slate-600 font-medium">
                        {city.currentWeather}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-800 line-clamp-3">
              💡 <strong>유저 고민 해결:</strong> "맛집을 찾아가도 광고에 속은 기분이 들어요" 하시는 분들을 위해 현지인 정찰제 인증 맛집과 줄 서지 않는 타임 위주로 추천합니다.
            </div>
          </div>

          {/* Price Alerts Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              항공 특가 즉각 알림 (Simulated XML)
            </h3>

            {loadingDeals ? (
              <div className="py-6 text-center text-slate-400 text-xs">특가 노선 탐색하는 중...</div>
            ) : (
              <div className="space-y-3">
                {flightDeals.map((deal) => (
                  <div key={deal.id} className="bg-red-50/40 border border-red-100 rounded-xl p-3.5 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-red-600 bg-red-100/60 px-1.5 py-0.5 rounded">
                          {deal.discountRate}% OFF
                        </span>
                        <div className="text-xs font-black text-slate-800 mt-1">
                          {deal.origin} → {deal.destination}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 line-through block">
                          {formatMoney(deal.averagePrice)}
                        </span>
                        <span className="text-xs font-black text-red-600 block">
                          {formatMoney(deal.dealPrice)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      🍳 {deal.carrier}: {deal.reason}
                    </p>
                    <button 
                      onClick={() => selectFlightDeal(deal)}
                      className="w-full mt-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                    >
                      이 특가 노선으로 일정 생성
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* MIDDLE COLUMN: Main Planner View (col-span-6) */}
        <section className="xl:col-span-6 flex flex-col gap-6">
          
          {/* Interactive Inputs Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">나만의 AI 여행 요구조건 정밀 제어</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">목적지 (영문/한글)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={userInput.destination}
                    onChange={(e) => setUserInput(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="도시 또는 국가명"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">여행 기간 (수일)</label>
                <select 
                  value={userInput.durationDays}
                  onChange={(e) => setUserInput(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value={1}>1 일정 대피</option>
                  <option value={2}>2박 3일 단기</option>
                  <option value={3}>3박 4일 명품</option>
                  <option value={4}>4박 5일 전격</option>
                  <option value={5}>5박 6일 몰입</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">여행 스타일 테마</label>
                <select 
                  value={userInput.travelStyle}
                  onChange={(e) => setUserInput(prev => ({ ...prev, travelStyle: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="gourmet">🍣 오직 먹방(미식 핫플) 위주</option>
                  <option value="budget">💡 가성비 최고의 알뜰 코스</option>
                  <option value="balanced">⚖️ 맛집과 명소 절반 밸런스</option>
                  <option value="leisure">🚶‍♀️ 힐링하며 여유롭게 걷기</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">예산 규모 설계</label>
                <select 
                  value={userInput.budgetTier}
                  onChange={(e) => setUserInput(prev => ({ ...prev, budgetTier: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="economy">이코노미 / 가성비 (실속파)</option>
                  <option value="moderate">일반적 비즈 / 추천 (중간형)</option>
                  <option value="premium">하이엔드 럭셔리 (최강 미식)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => generateItinerary()}
                disabled={generatingPlan}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              >
                {generatingPlan ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Gemini AI 최적화 일정 정밀 조율 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span>맞춤 먹방 및 예산 연계 동선 생성</span>
                  </>
                )}
              </button>

              {activePlan && (
                <button 
                  onClick={() => {
                    setActivePlan(null);
                    setUserInput({
                      destination: "후쿠오카 (Fukuoka)",
                      durationDays: 3,
                      travelStyle: "gourmet",
                      budgetTier: "moderate"
                    });
                  }}
                  title="초기화"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {errorPlan && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="font-extrabold text-red-900 block">AI 생성 지연 또는 에러</span>
                {errorPlan}
              </div>
            </div>
          )}

          {/* MAIN ITINERARY TIMELINE VIEW */}
          {activePlan ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 p shadow-sm flex-1 flex flex-col overflow-hidden">
              
              {/* Active Plan Meta Title Header */}
              <div className="flex justify-between items-start mb-6 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 font-extrabold px-2.5 py-1 rounded-md">
                      최적 추천완료
                    </span>
                    <span className="text-xs text-slate-400 font-medium">제안 도시: {activePlan.cityName}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {activePlan.cityName} ({activePlan.itinerary.length}일 스케줄)
                  </h2>
                  <p className="text-sm font-semibold text-blue-600 mt-1 italic">
                    🔍 "{activePlan.tagline}"
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold block uppercase tracking-wider">예산 점검</div>
                  <div className="text-xl font-black text-blue-600 mt-1">
                    {formatMoney(calculateTotalBudget())}
                  </div>
                </div>
              </div>

              {/* Route Overview */}
              <div className="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-800">메인 최단 동선:</strong> {activePlan.routeOverview}
                </div>
              </div>

              {/* Day Selector Accordion / Scroller */}
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {activePlan.itinerary.map((day: ItineraryDay) => (
                  <div key={day.dayNumber} className="border border-slate-100 rounded-2xl p-5 bg-[#FCFDFE]">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center font-bold">
                          <span className="text-[10px] text-slate-400 uppercase leading-none">DAY</span>
                          <span className="text-sm font-black leading-none mt-0.5">{day.dayNumber}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            {day.theme}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            💡 {day.routingTip}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Dynamic weather representation */}
                        <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-bold border border-amber-100">
                          {day.weatherCondition === 'Rainy' ? (
                            <CloudRain className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                          )}
                          <span>{day.weatherCondition === 'Sunny' ? '맑음' : day.weatherCondition === 'Rainy' ? '비상비' : '선선함'}</span>
                        </span>

                        {/* Crowd representation */}
                        <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-bold border ${
                          day.crowdLevel === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                          day.crowdLevel === 'Moderate' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          <Users className="w-3.5 h-3.5" />
                          <span>혼잡 {day.crowdLevel === 'High' ? '혼잡' : day.crowdLevel === 'Moderate' ? '보통' : '여유'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Spots Timeline inside Day */}
                    <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 mt-4">
                      {day.spots.map((spot, index) => (
                        <div key={index} className="relative group">
                          {/* Circle marker showing category */}
                          <div className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                            spot.category === 'food' ? 'bg-rose-500 text-white' :
                            spot.category === 'lodging' ? 'bg-emerald-500 text-white' :
                            spot.category === 'activity' ? 'bg-blue-500 text-white' :
                            'bg-amber-500 text-white'
                          }`}>
                            {spot.category === 'food' && <Utensils className="w-3 h-3" />}
                            {spot.category === 'lodging' && <Hotel className="w-3 h-3" />}
                            {spot.category === 'activity' && <Compass className="w-3 h-3" />}
                            {spot.category === 'transport' && <Plane className="w-3 h-3" />}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-xs font-black text-blue-600 block">
                              {spot.optimalTime}
                            </span>
                            <span className="text-[10px] text-slate-400 font-extrabold bg-slate-100 px-2 py-0.5 rounded">
                              ~ {formatMoney(spot.costEstimate)}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-slate-800 mt-1">
                            {spot.spotName}
                          </h5>

                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {spot.description}
                          </p>

                          {/* DILEMMA SOLVED BOX (The user's concerns solved) */}
                          <div className="mt-2 p-2.5 bg-blue-50/50 border border-blue-100/60 rounded-xl text-[11px] text-slate-600 flex gap-2 items-start">
                            <span className="text-blue-600 font-bold shrink-0 bg-blue-100/60 px-1.5 py-0.5 rounded leading-none">
                              고민해결
                            </span>
                            <p className="leading-normal">
                              📌 {spot.dilemmaSolved}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

              {/* FLOATING ACTION: Live Weather & Crowd density recalculation */}
              <div className="mt-6 pt-5 border-t border-slate-100 bg-[#FCFCFD] -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                      🌦️ 날씨 비상 또는 돌발 혼잡 대응 일정 실시간 무한 변경
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    현재 날씨(소나기 내림/폭설) 상황에 실내 미식 위주로 즉각 수정하거나, 특정 일이 너무 붐벼 우회하는 대안 경로로 AI 수정을 요청하세요.
                  </p>
                  
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      value={adjustmentInstruction}
                      onChange={(e) => setAdjustmentInstruction(e.target.value)}
                      placeholder="예) '갑자기 소나기가 내리니 실외 코스를 실내 맛집과 온천으로 바꿔줘'" 
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <button 
                      onClick={adjustItinerary}
                      disabled={adjustingPlan || !adjustmentInstruction.trim()}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
                    >
                      {adjustingPlan ? "실시간 변경 중..." : "수정 반영 (AI)"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Standard Placeholder empty state */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Compass className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">
                먹방과 완벽 예산 동선이 한곳에
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                현재 6월 초여름 시기에 가기 딱 알맞는 국내외의 미끼용 추천 리스트를 누르시거나, 상단 정밀 분석에 직접 입력해 100% 걱정 없는 여정을 꾸려보세요. 
              </p>
              
              {/* Short guidelines solver card */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Utensils className="w-4 h-4 text-rose-500" />
                    <span>진짜배기 먹방 동선</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">블로그 광고성 가짜 맛집 대신 현지 오리지널 노포 중심 밀집 배출</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>날씨 대응 구출</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">이동 중 갑작스레 비가 오면 실외 일정을 실내 쇼핑몰/카페로 즉시 자동 우회</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Budget Summary & Auto Checklist (col-span-3) */}
        <section className="xl:col-span-3 flex flex-col gap-6">
          
          {/* BUDGET DIVISION GRAPH & CALCULATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Budget Summary
              </h3>
              <span className="text-[10px] uppercase font-bold text-blue-600">
                Geometric Limit
              </span>
            </div>

            {activePlan ? (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {[
                    { label: "항공권 예약총액", amount: activePlan.budgetBreakdown.flight, color: "bg-blue-500" },
                    { label: "숙소 이용액", amount: activePlan.budgetBreakdown.lodging, color: "bg-emerald-500" },
                    { label: "먹방 미식 비용", amount: activePlan.budgetBreakdown.food, color: "bg-rose-500" },
                    { label: "액티비티/입장료", amount: activePlan.budgetBreakdown.activity, color: "bg-amber-500" }
                  ].map((x) => {
                    const total = calculateTotalBudget();
                    const ratio = total > 0 ? (x.amount / total) * 100 : 0;
                    return (
                      <div key={x.label} className="text-xs">
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>{x.label}</span>
                          <span className="font-extrabold text-slate-800">
                            {formatMoney(x.amount)} ({ratio.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${x.color} rounded-full`} style={{ width: `${ratio}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-black text-slate-700">추정 총 예산</span>
                  <span className="font-black text-blue-600 text-base">
                    {formatMoney(calculateTotalBudget())}
                  </span>
                </div>

                {/* Intelligent financial advice */}
                <div className="p-3 bg-blue-50/50 rounded-xl text-[11px] text-slate-600">
                  💡 <strong>예산 분석가:</strong> {
                    activePlan.budgetBreakdown.food > activePlan.budgetBreakdown.lodging ?
                    "미식 비중이 뚜렷한 식도락 중심의 세팅입니다. 소화제와 가벼운 에코백 지참을 강력 권고합니다." :
                    "숙소 및 호텔 퀄리티에 집중한 설계입니다. 피로누적에 약한 여행자분께 최고의 쉼표가 될 예정입니다."
                  }
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                일정을 생성하시면 예산 분배도가 자동으로 예각화됩니다.
              </div>
            )}
          </div>

          {/* CHECKLIST AUTOMATION SYSTEM */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Auto Checklist
                </h3>
                <h4 className="text-xs font-bold text-slate-800 mt-0.5">🎒 가방 싸기 준비물 자동생성</h4>
              </div>
              
              {activePlan && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  완료 {activePlan.checklist.filter(c => c.checked).length}/{activePlan.checklist.length}
                </span>
              )}
            </div>

            {activePlan ? (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                
                {/* Scrollable checklists */}
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-grow">
                  {activePlan.checklist.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors border ${
                        item.checked ? 'bg-slate-50 border-slate-100' : 'bg-white border-transparent'
                      }`}
                    >
                      <button 
                        onClick={() => toggleChecklistItem(item.id)}
                        className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                      >
                        {item.checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <div className="w-4 h-4 border border-slate-300 rounded" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold block ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.item}
                        </span>
                        
                        {!item.checked && (
                          <span className="text-[10px] text-slate-400 line-clamp-2 block mt-0.5 leading-normal">
                            👉 {item.whyNeeded}
                          </span>
                        )}
                        
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          item.category === 'essential' ? 'bg-indigo-50 text-indigo-600' :
                          item.category === 'foodie' ? 'bg-rose-50 text-rose-600' :
                          item.category === 'clothing' ? 'bg-amber-50 text-amber-600' :
                          'bg-sky-50 text-sky-600'
                        }`}>
                          {item.category === 'essential' ? '필수품' :
                           item.category === 'foodie' ? '식도락 꿀템' :
                           item.category === 'clothing' ? '의류/위생' : '증명서류'}
                        </span>
                      </div>

                      <button 
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Item */}
                <form onSubmit={addManualChecklistItem} className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="예) 인공눈물, 개인 상비약..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                    />
                    <button 
                      type="submit"
                      disabled={!newChecklistItem.trim()}
                      className="bg-slate-900 text-white text-xs px-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      추가
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">카테고리:</span>
                    {(['essential', 'foodie', 'clothing', 'documents'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNewChecklistCategory(cat)}
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          newChecklistCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat === 'essential' ? '필수' : cat === 'foodie' ? '먹방' : cat === 'clothing' ? '의류' : '서류'}
                      </button>
                    ))}
                  </div>
                </form>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                AI 플래너를 기둥 삼아 일정을 구상하면 현지 맞춤형 준비물 고화질 체크리스트가 자동 정렬됩니다.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* BOTTOM NAV / STATUS BAR */}
      <footer className="h-14 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 sticky bottom-0 z-50">
        <div className="flex gap-6">
          <button className="text-blue-600 text-xs font-black border-b-2 border-blue-600 h-full flex items-center px-1">
            💻 PLANNER DASHBOARD
          </button>
          <a hred="#" className="text-slate-400 text-xs font-semibold hover:text-slate-600 transition-colors flex items-center">
            ABOUT AI RECOMMEND
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400">
            AI Cloud Sync Active
          </span>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400"></div>
        </div>
      </footer>

    </div>
  );
}
