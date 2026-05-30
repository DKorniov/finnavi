"use client";

import type { BrokerWithRelations, ResidencyStatus } from "@/types/database";

interface BrokerCardsProps {
  brokers: BrokerWithRelations[];
  currentStatus: ResidencyStatus;
}

export function BrokerCards({ brokers, currentStatus }: BrokerCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {brokers.map((broker) => {
        // Проверяем доступность брокера для текущего типа ВНЖ
        const availability = broker.broker_availability?.find(
          (a) => a.residency_status === currentStatus
        );
        const isAvailable = availability ? availability.is_available : true; // по умолчанию true для международных

        return (
          <div 
            key={broker.id} 
            className={`border rounded-2xl p-6 bg-white shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
              broker.has_p2p_risk ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'
            }`}
          >
            <div>
              {/* Хедер карточки */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {broker.broker_type === 'international' ? 'Международный' :
                     broker.broker_type === 'crypto_exchange' ? 'Криптобиржа' : 'Локальный / P2P'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">{broker.name}</h3>
                </div>
                
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {isAvailable ? 'Доступен' : 'Ограничен'}
                </span>
              </div>

              {/* Критические риски (Data-First) */}
              {broker.has_p2p_risk && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4 text-xs text-rose-800 flex items-start gap-2">
                  <span className="text-sm">🚨</span>
                  <p><strong>Критический риск:</strong> Использование личных сербских карт для P2P-сделок ведет к моментальной блокировке счета банком.</p>
                </div>
              )}

              {/* Шлюзы пополнения (Funding Routes) */}
              <div className="space-y-3 mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Шлюзы из банков Сербии:</h4>
                {broker.funding_routes && broker.funding_routes.length > 0 ? (
                  broker.funding_routes.map((route) => (
                    <div key={route.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-700">{route.bank_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          route.success_rate === 'high' ? 'bg-emerald-100 text-emerald-800' :
                          route.success_rate === 'medium' ? 'bg-amber-100 text-amber-800' :
                          route.success_rate === 'low' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {route.success_rate === 'high' ? 'Проходит' :
                          route.success_rate === 'medium' ? 'Лимиты' :
                          route.success_rate === 'low' ? 'Сложно' : 'Блок'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{route.user_reports_summary}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Нет верифицированных шлюзов пополнения</p>
                )}
              </div>
            </div>

            {/* Слой монетизации (Lead-Gen / Affiliate) */}
            {broker.website_url && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a 
                  href={broker.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center block text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Инструкция по открытию
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}