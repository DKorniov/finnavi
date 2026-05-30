"use client";

import { useState, useMemo } from "react";
import type { LegalStatus, TaxRuleWithCategory } from "@/types/database";

interface TaxOptimizerProps {
  initialRules: TaxRuleWithCategory[];
}

export function TaxOptimizer({ initialRules }: TaxOptimizerProps) {
  // Строгий стейт на основе LegalStatus перечисления из database.ts
  const [legalStatus, setLegalStatus] = useState<LegalStatus>("individual");

  // Фильтрация правил: показываем либо общие правила для физлиц, либо специфичные для выбранного ИП/фриланс-режима
  const filteredRules = useMemo(() => {
    return initialRules.filter(
      (rule) => rule.user_legal_status === legalStatus || rule.user_legal_status === "individual"
    );
  }, [initialRules, legalStatus]);

  // Бизнес-аналитика: Карта условий для каждого режима (для вывода в UI справочной информации)
  const regimeDetails = useMemo(() => {
    switch (legalStatus) {
      case "individual":
        return {
          title: "Обычное физическое лицо (Резидент)",
          limit: "Без лимита по выручке",
          socials: "Нет фиксированных взносов",
          desc: "Идеально для пассивных инвесторов. Налоги платятся точечно по факту закрытия сделок (прирост капитала) или получения выплат (дивиденды). Требует самостоятельной подачи декларации в течение 30 дней с момента получения дохода."
        };
      case "frilenser":
        return {
          title: "Налоговый режим Frilenseri",
          limit: "Без жесткого лимита",
          socials: "Зависят от Модели (А или Б)",
          desc: "Режим для работы с иностранными юрлицами без открытия ИП. Две модели расчета: Модель А (выгодна при доходе до ~400€/мес) и Модель Б (выгодна при высоких доходах). Налоги платятся ежеквартально."
        };
      case "preduzetnik_pausal":
        return {
          title: "ИП Паушал (Фиксированный налог)",
          limit: "6 000 000 RSD / год",
          socials: "Фиксированные (~250-400€/мес)",
          desc: "Самый популярный режим для IT-экспатов. Налог не зависит от вашего реального дохода. Главные риски: жесткий лимит 6 млн динар на календарный год (иначе слет на ведение книг) и прохождение теста на самостоятельность (Test samostalnosti)."
        };
      case "preduzetnik_knjigas":
        return {
          title: "ИП Книгаш (С ведением книг)",
          limit: "8 000 000 RSD / год (для лимита ИП)",
          socials: "10% от чистой прибыли + соц. взносы",
          desc: "Учет реальных доходов и расходов. Рекомендуется, если у вас высокие подтвержденные расходы на ведение бизнеса или если вы не проходите Test samostalnosti. Требует обязательного найма сербского бухгалтера."
        };
      default:
        return null;
    }
  }, [legalStatus]);

  return (
    <div className="space-y-6">
      
      {/* Панель управления выбором налогового статуса */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Выберите ваш налоговый статус:
          </label>
          <select
            value={legalStatus}
            onChange={(e) => setLegalStatus(e.target.value as LegalStatus)}
            className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
          >
            <option value="individual">Физическое лицо (Инвестор)</option>
            <option value="frilenser">Фрилансер (Freelance Contract)</option>
            <option value="preduzetnik_pausal">Предузетник-Паушалац (Фикс. налог)</option>
            <option value="preduzetnik_knjigas">Предузетник-Книгаш (На чистую прибыль)</option>
          </select>
        </div>

        {/* Динамический блок бизнес-аналитики выбранного режима */}
        {regimeDetails && (
          <div className="lg:col-span-2 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{regimeDetails.title}</div>
              <p className="text-slate-500 leading-relaxed">{regimeDetails.desc}</p>
            </div>
            <div className="sm:col-span-1 bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center space-y-2 shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight block">Лимит оборота:</span>
                <span className="font-bold text-slate-800">{regimeDetails.limit}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight block">Социальные взносы:</span>
                <span className="font-bold text-blue-600">{regimeDetails.socials}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Таблица налоговых ставок */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Категория Актива</th>
                <th className="px-6 py-4">Тип дохода</th>
                <th className="px-6 py-4">Ставка налога</th>
                <th className="px-6 py-4">Специфика и лазейки (Опыт комьюнити)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs md:text-sm">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                    Данные по выбранному режиму временно отсутствуют
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/30 transition-colors">
                    
                    {/* Категория актива с безопасным опциональным чейнингом */}
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {rule.asset_categories?.name || "Общие доходы"}
                      <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                        Code: {rule.asset_categories?.code || "GEN"}
                      </span>
                    </td>

                    {/* Тип налога */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                        {rule.tax_type === 'dividend' ? 'Дивиденды' : 
                         rule.tax_type === 'capital_gains' ? 'Прирост капитала' : 
                         rule.tax_type === 'coupon' ? 'Купоны облигаций' : 
                         rule.tax_type === 'income_tax' ? 'Подоходный налог' : rule.tax_type}
                      </span>
                    </td>

                    {/* Ставка налога с подсветкой нулевых зон */}
                    <td className="px-6 py-4">
                      <span className={`text-base font-black ${rule.is_tax_free ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {rule.tax_rate_percent}%
                      </span>
                      {rule.is_tax_free && (
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase mt-0.5 tracking-tight">
                          Tax Free
                        </span>
                      )}
                    </td>

                    {/* Примечания */}
                    <td className="px-6 py-4 max-w-xs md:max-w-xl text-slate-600 leading-relaxed text-xs">
                      {/* Если в ТГ-логах зафиксированы критические кейсы, подсвечиваем их алертом */}
                      {rule.notes?.includes('45%') || rule.notes?.includes('Штраф') ? (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-rose-800">
                          <span className="text-sm shrink-0 mt-0.5">⚠️</span>
                          <span className="font-medium whitespace-pre-line">{rule.notes}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{rule.notes}</p>
                      )}
                      
                      {rule.legal_reference && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-2 italic">
                          Ref: {rule.legal_reference}
                        </span>
                      )}
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