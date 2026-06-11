import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in environment variables. Falling back to mock planner mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Prebaked mock responses for guaranteed operation if no API Key or for fallback handling
const MOCK_RECOMMEND_CITIES = [
  {
    name: "후쿠오카 (Fukuoka)",
    country: "일본 (Japan)",
    tagline: "비행기 타고 1시간, 진정한 돈코츠 라멘과 야타이(포장마차) 감성 먹방",
    foodHighlight: "하카타 돈코츠 라멘, 모츠나베(곱창전골), 미즈타키(닭한마리), 나카스 강변 야타이 거리",
    recommendedBudget: "50만 ~ 80만 원",
    bestVisitingReason: "현재 6월 기준 장마 전후의 저녁 선선한 바람 속에서 강변 포장마차(Yatai) 낭만을 온전히 만끽할 수 있는 최고의 미식 도시입니다. 비행 시간이 짧아 주말을 낀 단기 여행에 최고입니다.",
    crowdLevel: "Moderate",
    currentWeather: "맑음 / 선선 (23°C)",
    imageTheme: "Yatai ramen stall glow next to Nakas River at twilight"
  },
  {
    name: "타이베이 (Taipei)",
    country: "대만 (Taiwan)",
    tagline: "야시장에서 끝장내는 2백가지 길거리 미식과 우육면 성지순례",
    foodHighlight: "지우펀 만두, 융캉제 우육면, 스린 야시장의 지파이 및 왕자치즈감자, 망고빙수",
    recommendedBudget: "60만 ~ 95만 원",
    bestVisitingReason: "대만의 밤거리는 미식가의 천국입니다. 뜨거운 한낮에는 대형 에어컨이 빵빵한 역사관과 실내 딤섬 핫플을 탐방하고, 저녁엔 선선해진 야시장에서 가성비 넘치는 길거리 먹방을 이어갈 수 있습니다.",
    crowdLevel: "High",
    currentWeather: "흐림 / 소나기 (28°C)",
    imageTheme: "Taipei high altitude night market street lights neon dumplings"
  },
  {
    name: "제주도 (Jeju Island)",
    country: "대한민국 (South Korea)",
    tagline: "에메랄드빛 바다를 품은 흑돼지 구이와 초대형 특선 활어회 미식 탐방",
    foodHighlight: "제주 흑돼지 오겹살 솔잎구이, 전복 물회, 갈치조림, 오메기떡, 고기국수",
    recommendedBudget: "40만 ~ 70만 원",
    bestVisitingReason: "여름의 서막을 여는 6월의 제주는 수국이 만개하며 해안가 드라이브와 싱싱한 자연산 해산물을 야외 테라스에서 함께 즐기기 더없이 좋은 골든 타이밍입니다.",
    crowdLevel: "Moderate",
    currentWeather: "쾌청함 (22°C)",
    imageTheme: "Jeju emerald seashore with fresh black pork barbecue plate outdoor table"
  },
  {
    name: "방콕 (Bangkok)",
    country: "태국 (Thailand)",
    tagline: "단돈 몇 천원에 즐기는 미슐랭 스트리트 푸드와 달콤짜릿한 로티",
    foodHighlight: "팟타이, 똠얌꿍, 푸팟퐁커리, 카오산로드 길거리 콘치즈 로티, 망고 스티키 라이스",
    recommendedBudget: "70만 ~ 110만 원",
    bestVisitingReason: "저예산 여행자의 절대적인 강자! 6월의 방콕은 화려한 쇼핑몰 다이닝과 길거리 노포를 종횡무진하며 저렴한 가격에 미식의 정점을 체험하는 재미가 쏠쏠합니다.",
    crowdLevel: "High",
    currentWeather: "소나기 / 덥고 습함 (31°C)",
    imageTheme: "Bangkok dynamic street food stall with bubbling tom yum soup pots"
  }
];

const MOCK_FLIGHT_DEALS = [
  {
    id: "fd-1",
    origin: "인천 (ICN)",
    destination: "후쿠오카 (FUK)",
    carrier: "제주항공 (Jeju Air)",
    dealPrice: 168000,
    averagePrice: 245000,
    discountRate: 31,
    validUntil: "2026-06-18",
    reason: "비성수기 초특가 얼리버드 프로모션 적용. 주중(화-목) 출발 시 추가 5% 다운 가능."
  },
  {
    id: "fd-2",
    origin: "인천 (ICN)",
    destination: "타이베이 (TPE)",
    carrier: "중화항공 (China Airlines)",
    dealPrice: 289000,
    averagePrice: 390000,
    discountRate: 26,
    validUntil: "2026-06-15",
    reason: "풀서비스 캐리어(LCC 아님, 무료수하물 23kg 포함) 특가 상품으로 기내식 먹방 필수."
  },
  {
    id: "fd-3",
    origin: "김포 (GMP)",
    destination: "제주 (CJU)",
    carrier: "티웨이항공 (T'way)",
    dealPrice: 53000,
    averagePrice: 93000,
    discountRate: 43,
    validUntil: "2026-06-25",
    reason: "평일 편도 최저가 기준. 제주 해산물 라면과 딱새우 투어를 즉흥적으로 다녀올 수 있는 초강력 딜."
  },
  {
    id: "fd-4",
    origin: "인천 (ICN)",
    destination: "방콕 (BKK)",
    carrier: "진에어 (Jin Air)",
    dealPrice: 342000,
    averagePrice: 480000,
    discountRate: 28,
    validUntil: "2026-06-14",
    reason: "여름 야시장 축제 기간 항공편 증설 특별 이벤트 특가. 야간 비행 피로도를 이겨내고 갈 한정 특가."
  }
];

const PREBAKED_PLAN: Record<string, any> = {
  fukuoka: {
    cityName: "후쿠오카 (Fukuoka)",
    tagline: "미식에 온전히 바치는 3일간의 하카타 먹방투어",
    budgetBreakdown: {
      flight: 180000,
      lodging: 240000,
      food: 200000,
      activity: 80000,
      currencySymbol: "₩"
    },
    routeOverview: "하카타역 거점 -> 텐진 & 다이묘 미식 골목 -> 나카스 야타이 해안 동선",
    itinerary: [
      {
        dayNumber: 1,
        theme: "전설적인 라멘 입문과 강변 야타이 포장마차 로맨스",
        weatherCondition: "Sunny",
        crowdLevel: "Moderate",
        routingTip: "하카타역 도착 후 전철로 10분 내 텐진역 이동하여 호텔 체크인 하시면 모든 맛집이 도보권입니다.",
        spots: [
          {
            spotName: "신신라멘 하카타본점 (Shin Shin Ramen)",
            category: "food",
            description: "잡내 없는 하야시풍 육수로 초보자도 기분 좋게 들이켜는 극세사 면발의 후쿠오카 대표 돈코츠 핫플",
            optimalTime: "11:30 AM",
            costEstimate: 11000,
            dilemmaSolved: "웨이팅이 기므로 오픈 15분 전 대기를 하시면 점심 최고 황금 타이밍에 줄 안서고 바로 흡입 가능합니다."
          },
          {
            spotName: "텐진 오호리 공원 및 산책",
            category: "activity",
            description: "먹방 중간에 숨고르기. 아름다운 호수를 보며 말차 아이스크림을 시식하는 힐링 코스",
            optimalTime: "03:00 PM",
            costEstimate: 5000,
            dilemmaSolved: "배부름 현상을 해소하고 다음 미식인 곱창전골 소화를 위한 최적의 조깅/도보 유량입니다."
          },
          {
            spotName: "원조 모츠나베 오오야마 (Oyama)",
            category: "food",
            description: "고소한 우막창과 진한 미소(된장) 베이스 국물이 어우러져 한 숟가락마다 감탄사가 튀어나오는 식사 겸 반주 성지",
            optimalTime: "06:30 PM",
            costEstimate: 30000,
            dilemmaSolved: "자리가 넓고 1인석도 잘 되어 있어 혼자 여행하거나 가족 동반 시 눈치 보지 않고 아늑한 룸에서 최고의 모츠나베를 누릴 수 있습니다."
          }
        ]
      },
      {
        dayNumber: 2,
        theme: "다이묘 쇼핑가 런치와 후쿠오카 전통 타운 산책",
        weatherCondition: "Sunny",
        crowdLevel: "High",
        routingTip: "오늘은 전철 1일 패스를 구매해 기온역과 텐진미나미를 이동하는 동선이 다리 피로를 최적으로 줄입니다.",
        spots: [
          {
            spotName: "카와바타 단팥죽 거리 & 구시다 신사",
            category: "activity",
            description: "전통 상점가에서 달콤한 모찌 단팥죽을 떠먹으며 후쿠오카 하카타 축제의 기원을 둘러봅니다.",
            optimalTime: "10:30 AM",
            costEstimate: 6000,
            dilemmaSolved: "부모님 동반 여행 시 '밀가루나 기름진 게 너무 많다'는 불만을 완벽하게 잠재워주는 유서 깊고 고풍스러운 담백 먹방 루트입니다."
          },
          {
            spotName: "하카타 멘타이쥬 (Mentaiju)",
            category: "food",
            description: "윤기가 흐르는 하얀 쌀밥 위에 비법 소스로 절인 수제 명란 한 줄이 고스란히 얹어진 수려한 명란덮밥 도시락",
            optimalTime: "12:30 PM",
            costEstimate: 28000,
            dilemmaSolved: "웨이팅이 항상 50m를 넘지만, 오전 중 공식 웹사이트 스마트 예약을 활용하면 대기 없이 VIP석 수준으로 들어가 완벽한 고화질 한 판을 영접합니다."
          },
          {
            spotName: "텐진 다이묘 수제 디저트 플랫 (FUK Coffee)",
            category: "food",
            description: "여행 잡지 감성이 풀풀 풍기는 공항 컨셉 카페에서 달달하고 진득한 수제 푸딩과 크림 라떼 휴식",
            optimalTime: "03:30 PM",
            costEstimate: 9500,
            dilemmaSolved: "한여름 야외 쇼핑 후 찾아오는 발바닥 피로 및 당 수치 급락을 한 방에 충전하는 트렌디 안식처"
          },
          {
            spotName: "나카스 야타이(포장마차) 포장마차 맥주",
            category: "food",
            description: "강바람을 맞으며 명물 명란 만두, 꼬치구이에 시원한 나마비루(생맥주) 한 잔 곁들여 하루 미식 일정을 마무리",
            optimalTime: "08:30 PM",
            costEstimate: 25000,
            dilemmaSolved: "바가지 요금 악명이 자자한 야타이존이지만, 메뉴판 가격이 명확히 고지된 '정찰제 인증 포장마차'만을 선별 지정하여 안전하고 정직하게 낭만 득템 가능!"
          }
        ]
      }
    ],
    checklist: [
      { id: "item-1", item: "돼지코 110V 어댑터", category: "essential", whyNeeded: "일본 콘센트는 110V 전용이라 충전기를 꼽기 위해 반드시 2~3개 챙겨야 합니다.", checked: false },
      { id: "item-2", item: "소화제 및 까스활명수", category: "foodie", whyNeeded: "모츠나베, 돈코츠 라멘 등 기름진 미식이 몰려있는 하드코어 먹방 코스이므로 특효 처방 상비약이 필수입니다.", checked: false },
      { id: "item-3", item: "동전 지갑", category: "essential", whyNeeded: "일본은 택시나 소형 포장마차 결제 시 잔돈(동전)이 수없이 나오므로 주머니 무거움을 덜어주는 보관지갑이 요긴합니다.", checked: false },
      { id: "item-4", item: "비지트 재팬 웹(Visit Japan Web) 등록", category: "documents", whyNeeded: "입국 검사 및 세관 신고를 모바일 큐알로 5분만에 패스하도록 출국 전 공항 리무진에서 기재해두는 최강 팁.", checked: false }
    ]
  }
};

// --- API Endpoints ---

// 1. Get weather/date based local recommendations
app.get("/api/recommend-cities", async (req, res) => {
  const gemini = getGeminiClient();
  if (!gemini) {
    return res.json(MOCK_RECOMMEND_CITIES);
  }

  try {
    // Current date is June 2026. Request Gemini to give us recommendations.
    // We enforce structure for better visual representation.
    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "우리는 현재 2026년 6월 초여름에 있습니다. 한국 출발 기준으로 이번 달(6월 여름 초입)에 여행하기 가장 이상적이고 미식(먹방)과 힐링에 특화된 추천 해외/국내 도시 4곳을 정리해 줘. 각 도시마다 한글 이름, 타겟 국가 이름, 유혹적인 한 줄 설명, 먹어봐야 할 구체적인 푸드 하이라이트들, 예상 소요 예산대(KRW 예: 50만~80만원), 그리고 왜 하필 지금 2026년 6월 날씨나 제철 먹거리에 최적인지 그 과학적/감성적 이유 2~3문장, 혼잡도(Low, Moderate, High 중 하나), 현재 실시간 날씨 요약을 JSON 배열로 응답해 줘. 무조건 JSON 형식을 맞춰야 해.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              country: { type: Type.STRING },
              tagline: { type: Type.STRING },
              foodHighlight: { type: Type.STRING },
              recommendedBudget: { type: Type.STRING },
              bestVisitingReason: { type: Type.STRING },
              crowdLevel: { type: Type.STRING, description: "Low, Moderate, High 중 하나" },
              currentWeather: { type: Type.STRING },
              imageTheme: { type: Type.STRING, description: "해당 도시의 미식/거리 정취를 묘사하는 짧은 영어 아트 프롬프트 한줄" }
            },
            required: ["name", "country", "tagline", "foodHighlight", "recommendedBudget", "bestVisitingReason", "crowdLevel", "currentWeather", "imageTheme"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return res.json(parsed.length > 0 ? parsed : MOCK_RECOMMEND_CITIES);
  } catch (error) {
    console.error("Gemini recommendation error, using mock:", error);
    return res.json(MOCK_RECOMMEND_CITIES);
  }
});

// 2. Get active flight deals simulator based on destination or general
app.get("/api/flight-deals", (req, res) => {
  return res.json(MOCK_FLIGHT_DEALS);
});

// 3. Generate high performance travel plan with Gemini
app.post("/api/generate-plan", async (req, res) => {
  const { destination, durationDays, travelStyle, budgetTier } = req.body;
  if (!destination) {
    return res.status(400).json({ error: "Destination is required" });
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    // If no key, fall back to prebaked or a realistic generated mock tailored for destination
    const key = destination.toLowerCase().replace(/\s/g, "");
    if (PREBAKED_PLAN[key]) {
      return res.json(PREBAKED_PLAN[key]);
    } else {
      // Create a fast dynamic mock for that city
      const fallback = {
        cityName: destination,
        tagline: `${destination} 미식의 깊이에 완벽하게 몰입하는 ${durationDays}일간의 일정`,
        budgetBreakdown: {
          flight: budgetTier === 'economy' ? 300000 : budgetTier === 'moderate' ? 550000 : 900000,
          lodging: budgetTier === 'economy' ? 150000 : budgetTier === 'moderate' ? 400000 : 1000000,
          food: travelStyle === 'gourmet' ? 450000 : 250000,
          activity: 120000,
          currencySymbol: "₩"
        },
        routeOverview: "로컬 시장 중심 최적 도보 동선 및 대중교통 거점 연결 루트",
        itinerary: Array.from({ length: durationDays || 3 }).map((_, i) => ({
          dayNumber: i + 1,
          theme: `Day ${i + 1}: ${travelStyle === 'gourmet' ? '원조 시그니처 로컬 미식 및 숨은 노포 사냥' : '랜드마크 인생샷 및 실용주의 가성비 투어'}`,
          weatherCondition: "Sunny",
          crowdLevel: "Moderate",
          routingTip: "주요 역 3번 출구에서 시작되는 거점 위주 도선으로 환승 스트레스를 원천 차단합니다.",
          spots: [
            {
              spotName: `${destination} 중앙 미식 골목 투어`,
              category: "food" as const,
              description: `세계적인 평점이 높고 ${travelStyle === 'gourmet' ? '신선한 명품 식재료' : '오리지널 레시피'}를 지켜온 가장 직관적인 정통 맛집 거리`,
              optimalTime: "12:00 PM",
              costEstimate: 18000,
              dilemmaSolved: "웨이팅 사기 극성을 필터하고 오롯이 지역 원주민들만 아침 일찍 줄 서 먹는 정통파 가성비 맛집 배치"
            },
            {
              spotName: `${destination} 핫플레이스 예술문화 지구`,
              category: "activity" as const,
              description: "도시의 아이코닉한 골목과 인스타그램 포토스팟을 산책하며 감상을 나누는 낭만적 산책로",
              optimalTime: "03:30 PM",
              costEstimate: 0,
              dilemmaSolved: "유료 전망대 대신 무료면서 전망은 2배 끝내주는 황금 숨은 루프탑 포인트를 결합하여 낭비 예방"
            },
            {
              spotName: `${destination} 강변/해안 시그니처 비스트로`,
              category: "food" as const,
              description: "저녁 야경이 시원하게 보이는 탁 트인 통유리 야외석에서 감성과 요리를 한껏 음미하는 마무리 다이닝",
              optimalTime: "07:00 PM",
              costEstimate: 35000,
              dilemmaSolved: "예약 없인 못 가는 시그니처 뷰 맛집을 해질녘 30분 전 워크인으로 꿀자리 꿰차는 고유의 루트 가이드 반영"
            }
          ]
        })),
        checklist: [
          { id: "item-e1", item: "해외 결제 수수료 무료 카드 (트래블로그/머니)", category: "essential", whyNeeded: "현지 로컬 상점이나 자판기 수수료를 완벽히 격파해 누적 3만원 이상의 간접 할인을 보증합니다.", checked: false },
          { id: "item-e2", item: "휴대용 미니 선풍기 및 가벼운 보조배터리", category: "clothing", whyNeeded: "6월 점심의 활력 넘치는 더위를 뽀송하게 물리치며 영원히 사진을 찍을 수 있게 동반 배터리 소장 유지 필수", checked: false }
        ]
      };
      return res.json(fallback);
    }
  }

  try {
    const prompt = `
      도시명: ${destination}
      여행 기간: ${durationDays}일
      여행 스타일: ${travelStyle} (gourmet: 완전히 미식/먹방투어 위주, budget: 알뜰하고 영리한 가성비 동선, balanced: 맛과 볼거리가 절반씩 섞인 균형 코스, leisure: 힐링하고 걷기 쉬운 편안한 럭셔리 동선)
      예산 등급: ${budgetTier} (economy: 저예산 가성비, moderate: 평균적인 합리적 금액, premium: 럭셔리 및 고품격 숙소/식사 위주)

      위 입력 조건을 기반으로, 여행자가 겪는 고민들(예: "맛집이라더니 광고 광고 투성이고 웨이팅이 너무 길어 지침", "예산이 애매해서 비즈랑 이코노미 고민", "숙소와 동선이 엉켜 다리가 부서짐", "갑자기 비오거나 사람 미어터지면 어쩌지" 등)을 완벽히 해결하는 극강의 디테일 여행 한판을 짜 주십시오.

      이 플랜에는 다음 각 요소가 반드시 치밀하게 포함되어야 합니다:
      1. 총 예산(KRW 기준 정교한 항공/숙소/식비/놀거리 4분할 브레이크다운)
      2. 날짜별 완벽 최적 동선 플랜. (특히 '먹방(gourmet)' 옵션인 경우, 아침-점심-커피타임-디너 야식까지 동선이 깨지지 않고 도보나 지하철 20분 내로 긴밀히 연결되게 설정해야 함)
      3. 각 장소마다 여행자들의 실질적인 고민(웨이팅 피하기, 현지인 맛집 팁, 사기 예방)을 알려주는 "dilemmaSolved(고민해결 꿀팁)" 작성.
      4. 현지 특성(6월 초여름 계절감) 및 여행 스타일에 소름끼치도록 맞춘 '체크리스트' 수립.

      무조건 아래에 선언한 JSON Schema 규격대로 올바른 JSON 문자열만을 생성하세요.
    `;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cityName: { type: Type.STRING },
            tagline: { type: Type.STRING, description: "예: '한입 먹을 때마다 감탄하는, 텐진 골목 숨은 노포 3박 4일 탐험'" },
            budgetBreakdown: {
              type: Type.OBJECT,
              properties: {
                flight: { type: Type.INTEGER, description: "선택된 예산 등급에 맞춰 척도 맞춤한 대략적 한국발 왕복 항공료(원화 KRW)" },
                lodging: { type: Type.INTEGER, description: "총 기간 머무를 숙소 비용 총액(원화 KRW)" },
                food: { type: Type.INTEGER, description: "총 예상 식비 합계(원화 KRW)" },
                activity: { type: Type.INTEGER, description: "현지 교통 및 관광지 입장료(원화 KRW)" },
                currencySymbol: { type: Type.STRING, description: "항상 '₩'" }
              },
              required: ["flight", "lodging", "food", "activity", "currencySymbol"]
            },
            routeOverview: { type: Type.STRING, description: "전반적인 구역 이동 최적 플랫 요약" },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING, description: "해당 일차의 미식 주제" },
                  weatherCondition: { type: Type.STRING, description: "Sunny, Rainy, Cloudy, Windy 중 하나" },
                  crowdLevel: { type: Type.STRING, description: "Low, Moderate, High 중 하나" },
                  spots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        spotName: { type: Type.STRING, description: "현지 식당명 또는 관광 명소 이름" },
                        category: { type: Type.STRING, description: "food, lodging, activity, transport 중 하나" },
                        description: { type: Type.STRING, description: "왜 가야하며 어떤 대표 시그니처 메뉴/풍경을 파는가?" },
                        optimalTime: { type: Type.STRING, description: "추천 방문 시각 (예: '11:45 AM')" },
                        costEstimate: { type: Type.INTEGER, description: "인당 대략적인 1회 이용료/식사 가격(원화 KRW)" },
                        dilemmaSolved: { type: Type.STRING, description: "예: '대기 줄이 기니 회전률이 높은 점심 직후를 노려 20분 세이브!', '여기 블로그 광고 거르고 현지 원주민 칭찬 명물'" }
                      },
                      required: ["spotName", "category", "description", "optimalTime", "costEstimate", "dilemmaSolved"]
                    }
                  },
                  routingTip: { type: Type.STRING, description: "대중교통 활용 팁이나 동선 단축 비법 한줄" }
                },
                required: ["dayNumber", "theme", "weatherCondition", "crowdLevel", "spots", "routingTip"]
              }
            },
            checklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "예: item-c1, item-c2" },
                  item: { type: Type.STRING, description: "준비물명" },
                  category: { type: Type.STRING, description: "essential, foodie, clothing, documents 중 하나" },
                  whyNeeded: { type: Type.STRING, description: "선택한 도시나 맛집 투어 등에 유용한 이유" }
                },
                required: ["id", "item", "category", "whyNeeded"]
              }
            }
          },
          required: ["cityName", "tagline", "budgetBreakdown", "routeOverview", "itinerary", "checklist"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error) {
    console.error("Gemini full-plan generate failed:", error);
    return res.status(500).json({ error: "음성/텍스트 AI 요청 처리 중 오류가 생겼습니다. 잠시 후 재시도 해주세요." });
  }
});

// 4. Adapt and modify itinerary due to weather shifts or crowd warnings
app.post("/api/adjust-itinerary", async (req, res) => {
  const { currentPlan, requestInstruction } = req.body;
  if (!currentPlan || !requestInstruction) {
    return res.status(400).json({ error: "Missing plan or instruction to adjust." });
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    // Modify slightly on mocking side
    const plan = JSON.parse(JSON.stringify(currentPlan));
    plan.itinerary = plan.itinerary.map((day: any) => {
      day.weatherCondition = "Rainy";
      day.theme = `${day.theme} ☔ [실내 미식 구출작전 가동]`;
      day.spots = day.spots.map((spot: any) => {
        if (spot.category === "activity") {
          return {
            ...spot,
            spotName: "실내 미식 쇼핑몰 및 온천 테마파크",
            description: "갑작스러운 비를 대비해 쾌적하고 깔끔한 대형 실내 문화 공간과 푸드 로드로 변경했습니다.",
            dilemmaSolved: "비와 습기를 완전히 차단하고 쾌적하게 식사 및 디저트를 풀코스로 조집니다."
          };
        }
        return spot;
      });
      return day;
    });
    return res.json(plan);
  }

  try {
    const prompt = `
      현재 수립된 여행 계획은 다음과 같습니다:
      ${JSON.stringify(currentPlan)}

      사용자의 급박한 변경 요청 사항:
      "${requestInstruction}"

      이 요청에 따라 기존 수립된 일정을 완벽히 재생성(수정)해 주십시오. E.g. 비가 올 때 실외 공원을 실내 푸트코드로 대체하거나, 혼잡도가 우려되어 이른 아침으로 이동 시간을 조율하는 등 정밀 조율 하십시오. 
      수정된 이후에도 원래의 JSON Schema 규격(cityName, tagline, budgetBreakdown, routeOverview, itinerary, checklist)을 100% 똑같이 엄수하여 온전한 JSON 문자열로만 대답하십시오.
    `;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cityName: { type: Type.STRING },
            tagline: { type: Type.STRING },
            budgetBreakdown: {
              type: Type.OBJECT,
              properties: {
                flight: { type: Type.INTEGER },
                lodging: { type: Type.INTEGER },
                food: { type: Type.INTEGER },
                activity: { type: Type.INTEGER },
                currencySymbol: { type: Type.STRING }
              },
              required: ["flight", "lodging", "food", "activity", "currencySymbol"]
            },
            routeOverview: { type: Type.STRING },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  weatherCondition: { type: Type.STRING },
                  crowdLevel: { type: Type.STRING },
                  spots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        spotName: { type: Type.STRING },
                        category: { type: Type.STRING },
                        description: { type: Type.STRING },
                        optimalTime: { type: Type.STRING },
                        costEstimate: { type: Type.INTEGER },
                        dilemmaSolved: { type: Type.STRING }
                      },
                      required: ["spotName", "category", "description", "optimalTime", "costEstimate", "dilemmaSolved"]
                    }
                  },
                  routingTip: { type: Type.STRING }
                },
                required: ["dayNumber", "theme", "weatherCondition", "crowdLevel", "spots", "routingTip"]
              }
            },
            checklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  item: { type: Type.STRING },
                  category: { type: Type.STRING },
                  whyNeeded: { type: Type.STRING }
                },
                required: ["id", "item", "category", "whyNeeded"]
              }
            }
          },
          required: ["cityName", "tagline", "budgetBreakdown", "routeOverview", "itinerary", "checklist"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error) {
    console.error("Gemini plan adjustment error:", error);
    return res.status(500).json({ error: "날씨 비상 대응 계획을 수정하는 도중 AI 통신 장비에 에러가 발생했습니다." });
  }
});


// Serve static files in production or hook up Vite in dev mode
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Travel Planner fullstack server is active on port ${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error("Server bootstrap failed:", err);
});
