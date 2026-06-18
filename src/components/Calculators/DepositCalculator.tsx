// src/components/Calculators/DepositCalculator.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

type Currency = "EUR" | "RSD";
type Payout = "daily" | "monthly" | "end";

const TERMS = [1, 3, 6, 12, 24] as const;

// НБС данные — обновлять вручную при изменении
const NBS_RATE = 5.75;
const NBS_INFLATION = 2.8;
const NBS_DATE = "март 2026";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

export function DepositCalculator() {
  const [amount, setAmount] = useState(10000);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [term, setTerm] = useState(3);
  const [rate, setRate] = useState(5.5);
  const [payout, setPayout] = useState<Payout>("monthly");
  const [capitalization, setCapitalization] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const taxRate = currency === "EUR" ? 0.15 : 0;
  const r = rate / 100;
  const grossNoCap = amount * r * (term / 12);
  const grossCap = amount * (Math.pow(1 + r / 12, term) - 1);
  const gross = capitalization ? grossCap : grossNoCap;
  const tax = gross * taxRate;
  const net = gross - tax;
  const total = amount + net;
  const capBonus = (grossCap - grossNoCap) * (1 - taxRate);
  const realYield = (rate - NBS_INFLATION).toFixed(1);
  const realYieldNum = parseFloat(realYield);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + term);

  // Строим данные для графика
  const chartLabels: string[] = [];
  const dataBase: number[] = [];
  const dataCap: number[] = [];
  for (let m = 1; m <= term; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    chartLabels.push(d.toLocaleDateString("ru-RU", { month: "short" }));
    const gB = amount * r * (m / 12);
    const gC = amount * (Math.pow(1 + r / 12, m) - 1);
    dataBase.push(Math.round(amount + gB * (1 - taxRate)));
    dataCap.push(Math.round(amount + gC * (1 - taxRate)));
  }

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Без капитализации",
            data: dataBase,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.07)",
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "С капитализацией",
            data: dataCap,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.07)",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { font: { size: 11 }, boxWidth: 12 } },
        },
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => fmt(Number(v)),
            },
            grid: { color: "rgba(0,0,0,0.04)" },
          },
        },
      },
    });
    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [amount, rate, term, currency, capitalization]);

  return (
    <div className="space-y-5">
      {/* Верхняя двухколоночная сетка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Левый блок — параметры */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Параметры вклада</h3>

          <div className="space-y-4">
            {/* Сумма */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Сумма вклада</label>
              <input
                type="number"
                value={amount}
                step={100}
                min={100}
                onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Валюта */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Валюта</label>
              <div className="flex gap-2">
                {(["EUR", "RSD"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      currency === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Срок */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Срок</label>
              <div className="flex gap-2 flex-wrap">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerm(t)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      term === t
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {t} мес
                  </button>
                ))}
              </div>
            </div>

            {/* Ставка */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Ставка: <strong className="text-slate-900">{rate.toFixed(2)}%</strong> год.
              </label>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.25}
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <input
                type="number"
                min={0.5}
                max={15}
                step={0.25}
                value={rate}
                onChange={(e) => {
                  const v = Math.min(15, Math.max(0.5, parseFloat(e.target.value) || 0.5));
                  setRate(v);
                }}
                className="mt-1 w-24 text-sm px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Периодичность */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Периодичность выплат</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  ["daily", "Ежедневно"],
                  ["monthly", "Раз в месяц"],
                  ["end", "В конце"],
                ] as [Payout, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setPayout(val)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      payout === val
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Капитализация */}
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={capitalization}
                onChange={(e) => setCapitalization(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              Капитализация процентов
              <span className="relative group">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-200 text-[10px] text-slate-400 cursor-pointer">i</span>
                <span className="hidden group-hover:block absolute left-6 top-0 w-48 bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-500 leading-relaxed z-10">
                  Проценты прибавляются к телу вклада и сами начинают приносить доход. Выгодно на длинных сроках.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Правый блок — результат */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Результат</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Доход (брутто)</p>
              <p className="text-xl font-semibold text-emerald-600">+{fmt(gross)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Налог (Сербия)</p>
              <p className="text-xl font-semibold text-rose-600">{tax > 0 ? `-${fmt(tax)}` : "0"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Чистый доход</p>
              <p className="text-xl font-semibold text-emerald-600">+{fmt(net)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Итоговая сумма</p>
              <p className="text-xl font-semibold text-blue-600">{fmt(total)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Налоговый режим</span>
              <span className={currency === "EUR" ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}>
                {currency === "EUR" ? "15% (EUR депозит)" : "0% Tax Free (RSD)"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Капитализация</span>
              <span className="text-slate-700">
                {capitalization ? `Включена (+${fmt(Math.max(0, capBonus))} доп.)` : "Не включена"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Дата окончания</span>
              <span className="text-slate-700">{endDate.toLocaleDateString("ru-RU")}</span>
            </div>
          </div>

          {/* НБС плашка */}
          <div className="mt-4 flex flex-wrap items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 text-[11px] text-slate-500">
            <span>НБС: <strong className="text-slate-700">{NBS_RATE}%</strong></span>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium">
              Инфляция: {NBS_INFLATION}%
            </span>
            <span className={realYieldNum >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
              Реал. доходность: {realYieldNum >= 0 ? "+" : ""}{realYield}%
            </span>
            <span className="ml-auto text-slate-400">{NBS_DATE}</span>
          </div>
        </div>
      </div>

      {/* Нижний блок — график */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">График прироста капитала</h3>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}