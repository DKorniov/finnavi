"use client";

import { useState } from "react";
import type { LegalStatus, TaxRuleWithCategory } from "../../types/database";

interface TaxOptimizerProps {
  initialRules: TaxRuleWithCategory[];
}

export function TaxOptimizer({ initialRules }: TaxOptimizerProps) {
  const [legalStatus, setLegalStatus] = useState<LegalStatus>("individual");

  const filteredRules = initialRules.filter(
    (rule) => rule.user_legal_status === legalStatus || rule.user_legal_status === "individual"
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Налоговый оптимизатор</h2>
          <p className="text-sm text-slate-500 mt-1">Основано на законах РС и опыте комьюнити</p>
        </div>
        
        <select
          value={legalStatus}
          onChange={(e) => setLegalStatus(e.target.value as LegalStatus)}
          className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg block p-2.5 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="individual">Физическое лицо (ВНЖ)</option>
          <option value="preduzetnik_pausal">ИП на Паушале</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Актив</th>
              <th scope="col" className="px-4 py-3 font-semibold">Тип дохода</th>
              <th scope="col" className="px-4 py-3 font-semibold">Ставка (РС)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Нюансы (Data-First)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-medium text-slate-900">
                  {/* Безопасное обращение через правильный ключ таблицы */}
                  {rule.asset_categories?.name || "Неизвестный актив"}
                </td>
                <td className="px-4 py-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                    {rule.tax_type === 'dividend' ? 'Дивиденды' : 
                     rule.tax_type === 'capital_gains' ? 'Прирост капитала' : 
                     rule.tax_type === 'coupon' ? 'Купоны' : rule.tax_type}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`font-bold ${rule.is_tax_free ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {rule.tax_rate_percent}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  {rule.notes?.includes('45%') ? (
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">⚠️</span>
                      <span className="text-rose-700 font-medium">{rule.notes}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">{rule.notes}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}