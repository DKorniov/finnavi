"use client";

import { useState } from "react";
import type { ServiceProvider } from "../../types/database";

interface VerifiedExpertsProps {
  providers: ServiceProvider[];
}

export function VerifiedExperts({ providers = [] }: VerifiedExpertsProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !selectedProvider) return;
    
    setIsSubmitting(true);
    // TODO: Здесь будет Server Action для записи лида в Supabase (lead_requests)
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedProvider(null);
        setContact("");
      }, 3000);
    }, 800);
  };

  const getCategoryName = (cat: string) => {
    switch(cat) {
      case 'accounting': return 'Бухгалтерия';
      case 'legal': return 'ВНЖ и Право';
      case 'banking': return 'Банки и Комплаенс';
      case 'tax_consulting': return 'Налоги и Крипта';
      default: return 'Консалтинг';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white">
      <div className="mb-8 md:flex justify-between items-end">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Проверенные Эксперты <span className="text-blue-400">ExpatFinance</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Мы проверили этих специалистов, чтобы вы не столкнулись с «гостингом», скрытыми комиссиями и языковым барьером. Гарантия прозрачного прайса и знания современных реалий (крипта, IBKR, W-8BEN).
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium">🛡 Anti-Scam</span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium">🇷🇺 Русскоязычные</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-colors rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                  {getCategoryName(provider.category)}
                </span>
                {provider.is_verified && <span className="text-emerald-400" title="Verified">✓</span>}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{provider.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-4 leading-relaxed mb-4">
                {provider.description}
              </p>
            </div>
            
            <div className="border-t border-slate-700/50 pt-4 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-400">Прайс (Market Rate):</span>
                <span className="text-sm font-bold text-emerald-400">{provider.price_range}</span>
              </div>
              
              {selectedProvider === provider.id ? (
                <form onSubmit={handleLeadSubmit} className="space-y-2 animate-in fade-in duration-200">
                  <input 
                    type="text" 
                    placeholder="Telegram (@username) или Email" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Отправка...' : success ? 'Заявка принята!' : 'Связаться со мной'}
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setSelectedProvider(provider.id)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Оставить заявку
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}