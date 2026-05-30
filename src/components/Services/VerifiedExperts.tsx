"use client";

import { useState, useMemo } from "react";
import type { ServiceProvider } from "@/types/database";

interface VerifiedExpertsProps {
  providers: ServiceProvider[];
}

export function VerifiedExperts({ providers = [] }: VerifiedExpertsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  // Стейты формы
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const getCategoryName = (cat: string) => {
    switch(cat) {
      case 'accounting': return 'Бухгалтерия и налоги';
      case 'legal': return 'ВНЖ и Право';
      case 'banking': return 'Банки и Комплаенс';
      case 'tax_consulting': return 'Налоговая оптимизация';
      default: return 'Разное';
    }
  };

  const filteredProviders = useMemo(() => {
    if (activeCategory === "all") return providers;
    return providers.filter(p => p.category === activeCategory);
  }, [providers, activeCategory]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !selectedProvider) return;
    
    setIsSubmitting(true);
    
    // В v2.1 здесь будет вызов Server Action для вставки в таблицу lead_requests
    // Пока эмулируем задержку сети
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

  return (
    <div className="space-y-6">
      
      {/* Навигация по категориям */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeCategory === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Все специалисты
        </button>
        {['legal', 'accounting', 'banking'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {getCategoryName(cat)}
          </button>
        ))}
      </div>

      {/* Сетка экспертов */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 text-sm">В этой категории пока нет проверенных специалистов.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div 
              key={provider.id} 
              className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                provider.is_promoted ? 'border-blue-300 ring-2 ring-blue-50/50' : 'border-slate-200'
              }`}
            >
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{provider.name}</h3>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mt-1">
                      {provider.title}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-amber-500 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded-md">
                      ★ {provider.rating}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">{provider.reviews_count} отзывов</span>
                  </div>
                </div>

                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    Verified
                  </span>
                )}

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {provider.description}
                </p>

                {provider.pricing_notes && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Прайс / Условия:</span>
                    <span className="text-xs font-medium text-slate-700">{provider.pricing_notes}</span>
                  </div>
                )}
              </div>
              
              {/* Блок захвата лида */}
              {selectedProvider === provider.id ? (
                <form onSubmit={handleLeadSubmit} className="space-y-3 bg-slate-900 p-4 rounded-xl animate-fade-in">
                  <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Куда вам написать?</label>
                  <input 
                    type="text" 
                    placeholder="@telegram или Email" 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting || success}
                    className={`w-full text-sm font-bold py-2.5 rounded-lg transition-colors ${
                      success ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isSubmitting ? 'Отправка...' : success ? '✓ Контакт передан' : 'Запросить консультацию'}
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setSelectedProvider(provider.id)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold py-3 rounded-xl transition-colors border border-slate-200"
                >
                  Связаться со специалистом
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}