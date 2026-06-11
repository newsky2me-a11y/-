import React, { useState } from "react";
import { FlightDeal } from "../types";
import { Plane, TrendingDown, Bell, BellOff, ArrowRight } from "lucide-react";

interface FlightDealsProps {
  deals: FlightDeal[];
  destinationName: string;
}

export default function FlightDeals({ deals, destinationName }: FlightDealsProps) {
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(200000);
  const [isAlertEnabled, setIsAlertEnabled] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Filter deals closest to destinationName or default to first 2
  const matchedDeals = deals.filter(
    (d) =>
      d.destination.includes(destinationName) ||
      destinationName.includes(d.destination.split(" ")[0])
  );

  const displayDeals = matchedDeals.length > 0 ? matchedDeals : deals.slice(0, 2);

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAlertEnabled(true);
    setNotifications([
      `🔔 알림 등록 완료: ${destinationName} 항공권이 ${alertTargetPrice.toLocaleString()}원 이하로 내려갈 시 회원정보 이메일(newsky2me@gmail.com)로 번개 알림을 전송합니다!`
    ]);
  };

  const cancelAlert = () => {
    setIsAlertEnabled(false);
    setNotifications([]);
  };

  return (
    <div id="flight-deals-container" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-rose-500 text-white rounded-xl">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">초특가 모니터링 & 스마트 알람</h2>
          <p className="text-xs text-slate-400">대한항공, 아시아나, LCC 전 항공사 6월 특선 분석</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {displayDeals.map((deal) => (
          <div key={deal.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-500 px-2.5 py-0.5 bg-rose-50 rounded-full">
                {deal.discountRate}% 한정 판매
              </span>
              <span className="text-xs text-slate-400">마감기한: {deal.validUntil}</span>
            </div>

            <div className="flex items-center justify-between my-3">
              <div>
                <p className="text-xs text-slate-400">{deal.carrier}</p>
                <p className="text-sm font-bold text-slate-700">
                  {deal.origin} <ArrowRight className="inline-block w-3.5 h-3.5 mx-1" /> {deal.destination}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 line-through">
                  ₩{deal.averagePrice.toLocaleString()}
                </p>
                <p className="text-base font-extrabold text-slate-900">
                  ₩{deal.dealPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Price compare bar visualizer */}
            <div className="space-y-1 mt-3 pt-2 border-t border-dashed border-slate-200">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>오늘 최저가 (₩{deal.dealPrice.toLocaleString()})</span>
                <span>평균가 (₩{deal.averagePrice.toLocaleString()})</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full relative">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-rose-500 rounded-full" 
                  style={{ width: `${(deal.dealPrice / deal.averagePrice) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed bg-white p-2 rounded border border-slate-100">
              ⚡ <span className="font-semibold text-slate-700">분석 팩트:</span> {deal.reason}
            </p>
          </div>
        ))}
      </div>

      {/* Dynamic Alarm Setter Widget */}
      <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500 text-white rounded-lg">
            <Bell className="w-4 h-4 animation-bounce" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900">{destinationName} 맞춤 특가 선제 알림</h3>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              자체 실시간 로봇이 1분마다 전 세계 항공권 사이트를 스캔합니다. 원하는 한계 금액 이하로 떨어질 시 카톡 알람을 무료로 즉시 받아보세요!
            </p>

            <form onSubmit={handleSaveAlert} className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">🎯 알람 기준가</span>
                <input
                  type="number"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(Number(e.target.value))}
                  min={20000}
                  step={10000}
                  disabled={isAlertEnabled}
                  className="w-full pl-22 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
              </div>
              {isAlertEnabled ? (
                <button
                  type="button"
                  onClick={cancelAlert}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <BellOff className="w-3.5 h-3.5" /> 취소
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-lg text-xs transition-colors"
                >
                  알림 예약
                </button>
              )}
            </form>

            {notifications.map((notif, index) => (
              <div key={index} className="mt-3 text-xs bg-white text-indigo-800 p-2.5 rounded border border-indigo-100 font-medium">
                {notif}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
