"use client";

import { useState } from "react";
import type { DepositRate, BondYield, CurrencySpread } from "@/types/database";

interface YieldComparatorProps {
  deposits: DepositRate[];
  bonds: BondYield[];
  spreads: CurrencySpread[];
}

export function YieldComparator({ deposits, bonds, spreads }: YieldComparatorProps) {
  const [amount, setAmount] = useState<number>(10000);

  // Безопасный поиск объектов без риска падения рантайма
  const bestRsdDeposit = deposits?.find(d => d?.currency === 'RSD');
  const eurBond = bonds?.find(b => b?.bond_type === 'RS_GOV_EUR');
  const raiffSpread = spreads?.find(s => s?.bank_name === 'Raiffeisen' && s?.account_type === 'business');

  // Принудительное приведение к Number для защиты от строковых типов СУБД
  const rsdDepositRate = Number(bestRsdDeposit ? bestRsdDeposit.interest_rate_pct : 4.5);
  const bondYield = Number(eurBond ? eurBond.yield_rate_pct : 4.0);
  const bondEntryFee = Number(eurBond ? eurBond.broker_entry_fee_pct : 5.0);
  const bondCustodyFee = Number(eurBond ? eurBond.broker_custody_fee_pct : 1.0);
  const avgSpreadLoss = Number(raiffSpread ? raiffSpread.spread_loss_pct : 1.5);

  // Математика калькулятора реальной доходности
  const convertedToRsdValue = amount * (1 - avgSpreadLoss / 100);
  const rsdGrossProfit = convertedToRsdValue * (rsdDepositRate / 100);
  const rsdNetProfitEur = (convertedToRsdValue + rsdGrossProfit) * (1 - avgSpreadLoss / 100) - amount;

  const bondGrossProfit = amount * (bondYield / 100);
  const bondNetProfit = bondGrossProfit - (amount * (bondEntryFee / 100)) - (amount * (bondCustodyFee / 100));

  // АРХИТЕКТУРНОЕ РЕШЕНИЕ: Жестко задаем локаль 'ru-RU'. 
  // Теперь и сервер, и клиент отформатируют 10000 как "10 000". Никаких ошибок гидратации и никаких useEffect.
  const displayAmount = amount.toLocaleString('ru-RU');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Реальная доходность: Иллюзии vs Факты</h2>
        <p className="text-sm text-slate-500 mt-1">
          Расчет для инвестиции в <span className="font-bold text-slate-800">€ {displayAmount}</span> на 1 год с учетом скрытых комиссий и налогов.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Сумма инвестиции (EUR)</label>
        <input 
          type="range" 
          min="1000" 
          max="100000" 
          step="1000"
          value={amount} 
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="mt-2 font-mono text-lg font-semibold text-blue-600">
          € {displayAmount}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Карточка 1: Депозит в Динарах */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Депозит в Динарах (RSD)</h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                {rsdDepositRate}% годовых
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Ставка привлекательна, налог 0%. Но прибыль сгорает на двойной конвертации по курсу банка.</p>
          </div>
          
          <div className="space-y-2 text-sm pt-2 border-t border-slate-100">
            <div className="flex justify-between text-slate-600 text-xs md:text-sm">
              <span>Доход по ставке:</span>
              <span className="font-medium">+ € {Math.round(amount * (rsdDepositRate / 100)).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex justify-between text-rose-600 text-xs md:text-sm">
              <span>Потеря на спреде (ввод + вывод):</span>
              <span>- € {Math.round(amount * (avgSpreadLoss / 100) * 2).toLocaleString('ru-RU')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
              <span>Чистый итог:</span>
              <span className={rsdNetProfitEur >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {rsdNetProfitEur >= 0 ? '+' : ''}€ {Math.round(rsdNetProfitEur).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        {/* Карточка 2: Гособлигация */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Гособлигация Сербии (EUR)</h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                {bondYield}% годовых
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Налог 0%. Но локальные брокеры (OTP) берут огромные комиссии за вход и хранение.</p>
          </div>
          
          <div className="space-y-2 text-sm pt-2 border-t border-slate-100">
            <div className="flex justify-between text-slate-600 text-xs md:text-sm">
              <span>Купонный доход:</span>
              <span className="font-medium">+ € {Math.round(bondGrossProfit).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex justify-between text-rose-600 text-xs md:text-sm">
              <span>Комиссия за сделку (до {bondEntryFee}%):</span>
              <span>- € {Math.round(amount * (bondEntryFee / 100)).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex justify-between text-rose-600 text-xs md:text-sm">
              <span>Комиссия за хранение ({bondCustodyFee}%):</span>
              <span>- € {Math.round(amount * (bondCustodyFee / 100)).toLocaleString('ru-RU')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
              <span>Чистый итог:</span>
              <span className={bondNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {bondNetProfit >= 0 ? '+' : ''}€ {Math.round(bondNetProfit).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
        <span className="font-bold">💡 Совет ExpatFinance:</span> Динарские вклады выгодны только если вы зарабатываете и тратите в динарах. Облигации через сербские банки невыгодны на срок менее 3-5 лет из-за комиссий. Рассмотрите международных брокеров для покупки ETF (с учетом налога 15%).
      </div>
    </div>
  );
}