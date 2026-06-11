import React from "react";
import { BudgetBreakdown } from "../types";
import { Wallet, Plane, Hotel, Utensils, Compass } from "lucide-react";

interface BudgetVisualizerProps {
  budget: BudgetBreakdown;
}

export default function BudgetVisualizer({ budget }: BudgetVisualizerProps) {
  const { flight, lodging, food, activity, currencySymbol } = budget;
  const total = flight + lodging + food + activity;

  const items = [
    {
      name: "항공편 (Flights)",
      amount: flight,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-50",
      icon: Plane,
    },
    {
      name: "숙소 (Lodging)",
      amount: lodging,
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-50",
      icon: Hotel,
    },
    {
      name: "먹방 미식 (Foodie Tour)",
      amount: food,
      color: "bg-rose-500",
      textColor: "text-rose-500",
      bgColor: "bg-rose-50",
      icon: Utensils,
    },
    {
      name: "액티비티/액션 (Activities)",
      amount: activity,
      color: "bg-amber-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-50",
      icon: Compass,
    },
  ];

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div id="budget-visualizer-container" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500 text-white rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">예산 기반 지출 분할 추천</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">총 예산 권장량</span>
          <span className="text-xl font-extrabold text-indigo-600">
            {currencySymbol} {formatNumber(total)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percentage = total > 0 ? (item.amount / total) * 100 : 0;
          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${item.bgColor} ${item.textColor}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">
                    {currencySymbol}{formatNumber(item.amount)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Progressive Load Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-800 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
        <div className="text-xs text-slate-500 leading-relaxed">
          💡 <span className="font-bold text-slate-700">추천 가이드: </span>
          {food > lodging ? (
            <span>식비 예산이 큽니다! 로컬 야시장, 디저트 핫플, 미슐랭 노포 등을 중심으로 호화스러운 미식 경험을 전개하시기 좋은 비율입니다.</span>
          ) : (
            <span>안락한 휴식처를 중시한 배치입니다. 주요 먹방 핫플레이스 인근 지하철역 부근의 도보가 편한 숙소를 예약하는 것이 비용 효율적입니다.</span>
          )}
        </div>
      </div>
    </div>
  );
}
