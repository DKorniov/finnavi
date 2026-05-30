"use client";

import { useState, useMemo } from "react";
import { useResidency } from "@/components/ResidencyProvider";
import type { AvailabilityItem } from "@/types/database";

interface BankMatrixProps {
  initialItems: AvailabilityItem[];
}

export function BankMatrix({ initialItems }: BankMatrixProps) {
  // Достаем глобальный тип лица (Физлицо / ИП)
  const { legalType } = useResidency(); 
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Отслеживаем предыдущий legalType для сброса вкладок
  const [prevLegalType, setPrevLegalType] = useState(legalType);

  // Паттерн React 18+: сброс стейта прямо во время рендера без использования useEffect.
  // Защищает от каскадных перерисовок и предупреждений линтера.
  if (legalType !== prevLegalType) {
    setPrevLegalType(legalType);
    setActiveCategory("all");
  }

  // Безопасная нормализация данных на основе интерфейсов из database.ts
  const normalizedItems = useMemo(() => {
    return initialItems.map((item) => {
      const product = item.products;
      const bank = product?.banks;
      
      return {
        id: item.id,
        isAvailable: item.is_available,
        probability: item.approval_probability || "low",
        notes: item.notes || "Нет специфических комментариев комьюнити",
        productName: product?.name || "Базовый пакет",
        category: product?.category || "personal_account",
        bankName: bank?.name || "Неизвестный Банк",
        siteUrl: bank?.official_site || "#"
      };
    });
  }, [initialItems]);

  // Фильтрация данных по типу лица, вкладке и поисковой строке
  const filteredItems = useMemo(() => {
    let result = normalizedItems;

    // Шаг 1: Разделение по типу лица (Физлицо не должно видеть счета ИП и наоборот)
    result = result.filter(item => {
      if (legalType === "individual") {
        return item.category === "personal_account" || item.category === "savings";
      } else {
        return item.category === "business_account";
      }
    });

    // Шаг 2: Фильтр по локальной вкладке модуля
    if (activeCategory !== "all") {
      result = result.filter(item => item.category === activeCategory);
    }

    // Шаг 3: Текстовый поиск по банку и названию продукта
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.bankName.toLowerCase().includes(q) || 
        item.productName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [normalizedItems, activeCategory, searchQuery, legalType]);

  // Стилизация бейджей комплаенса
  const getBadgeStyles = (prob: string, isAvailable: boolean) => {
    if (!isAvailable) return "bg-slate-100 text-slate-500 border-slate-200";
    switch (prob.toLowerCase()) {
      case 'high': return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'medium': return "bg-amber-50 text-amber-700 border-amber-200";
      case 'low': return "bg-orange-50 text-orange-700 border-orange-200";
      case 'blocked': return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Локализация статусов вероятности открытия
  const translateProbability = (prob: string, isAvailable: boolean) => {
    if (!isAvailable) return "Недоступно";
    switch (prob.toLowerCase()) {
      case 'high': return "Высокая";
      case 'medium': return "Средняя (50/50)";
      case 'low': return "Низкая";
      case 'blocked': return "Отказ (Блок)";
      default: return prob;
    }
  };

  // Конфигурация вкладок
  const tabsConfig = [
    { id: "all", label: "Все продукты", showFor: "both" },
    { id: "personal_account", label: "Личные карты", showFor: "individual" },
    { id: "savings", label: "Депозиты", showFor: "individual" },
    { id: "business_account", label: "Счета для ИП", showFor: "business" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Панель фильтров и поиска */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Табы, подстраивающиеся под тип лица */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto w-full sm:w-auto overflow-x-auto">
          {tabsConfig
            .filter(tab => tab.showFor === "both" || tab.showFor === legalType)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeCategory === tab.id 
                    ? "bg-white text-blue-600 shadow-xs" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
          ))}
        </div>

        {/* Инпут поиска */}
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Поиск банка..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      {/* Контейнер таблицы */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Банк и Продукт</th>
                <th className="px-6 py-4">Категория</th>
                <th className="px-6 py-4">Вероятность открытия</th>
                <th className="px-6 py-4">Сводка из чатов (Опыт)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-slate-500 text-sm font-medium">Нет данных по выбранным критериям.</p>
                    <p className="text-slate-400 text-xs mt-1">Попробуйте изменить тип лица в верхнем меню или очистить поиск.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    
                    {/* Название банка и продукта */}
                    <td className="px-6 py-4 min-w-50">
                      <div className="font-bold text-slate-900">{item.bankName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.productName}</div>
                    </td>

                    {/* Категория счета */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {item.category === 'business_account' ? 'Бизнес (ИП)' : item.category === 'personal_account' ? 'Личный счет' : 'Сберегательный'}
                    </td>

                    {/* Вероятность прохождения KYC */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wide ${getBadgeStyles(item.probability, item.isAvailable)}`}>
                        {translateProbability(item.probability, item.isAvailable)}
                      </span>
                    </td>

                    {/* Логи и инсайды */}
                    <td className="px-6 py-4 max-w-xs md:max-w-md">
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.notes}
                      </p>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}