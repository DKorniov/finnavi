// src/components/Calculators/CreditCalculator.tsx
"use client";

import { useState, useMemo } from "react";

type CreditMode = "consumer" | "mortgage";
type RateType = "fixed" | "variable" | "combined";
type PaymentType = "annuity" | "diff";
type Currency = "EUR" | "RSD";
type RateBase = "EURIBOR 3M" | "EURIBOR 6M" | "Belibor 3M";

interface ScheduleRow {
  date: Date;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${
            value === o.value
              ? "bg-slate-900 text-white border-slate-900"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-block">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-200 text-[10px] text-slate-400 cursor-pointer ml-1">i</span>
      <span className="hidden group-hover:block absolute left-6 top-0 w-52 bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-500 leading-relaxed z-10">
        {text}
      </span>
    </span>
  );
}

export function CreditCalculator() {
  const [mode, setMode] = useState<CreditMode>("consumer");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [termYears, setTermYears] = useState(10);
  const [rateType, setRateType] = useState<RateType>("fixed");
  const [paymentType, setPaymentType] = useState<PaymentType>("annuity");

  // Сумма — для ипотеки вычисляется из стоимости и взноса
  const [loanAmount, setLoanAmount] = useState(20000);
  const [propValue, setPropValue] = useState(120000);
  const [downPayment, setDownPayment] = useState(24000);

  // Фиксированная ставка
  const [fixedRate, setFixedRate] = useState(6.0);

  // Переменная ставка
  const [rateBase, setRateBase] = useState<RateBase>("EURIBOR 3M");
  const [baseValue, setBaseValue] = useState(2.5);
  const [margin, setMargin] = useState(2.49);

  // Комбинированная ставка
  const [fixPeriodYears, setFixPeriodYears] = useState(5);
  const [fixPeriodRate, setFixPeriodRate] = useState(4.2);
  const [combinedBase, setCombinedBase] = useState<"EURIBOR 3M" | "EURIBOR 6M">("EURIBOR 3M");
  const [combinedMargin, setCombinedMargin] = useState(2.4);

  const [showAll, setShowAll] = useState(false);

  // Вычисляем актуальную сумму и ставку
  const effectiveLoan = mode === "mortgage" ? Math.max(0, propValue - downPayment) : loanAmount;
  const ltv = mode === "mortgage" ? Math.round((effectiveLoan / propValue) * 100) : 0;

  const effectiveRate =
    rateType === "fixed"
      ? fixedRate
      : rateType === "variable"
      ? baseValue + margin
      : fixPeriodRate;

  const n = termYears * 12;
  const r = effectiveRate / 100 / 12;

  // Аннуитетный платёж
  const annuityPayment =
    r === 0 ? effectiveLoan / n : (effectiveLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  // Дифференцированный — первый платёж (максимальный)
  const diffFirstPayment = effectiveLoan / n + effectiveLoan * r;

  const payment = paymentType === "annuity" ? annuityPayment : diffFirstPayment;

  // Общая сумма и переплата
  const totalPay = useMemo(() => {
    if (paymentType === "annuity") return annuityPayment * n;
    let total = 0;
    let bal = effectiveLoan;
    const pr = effectiveLoan / n;
    for (let i = 0; i < n; i++) {
      total += pr + bal * r;
      bal -= pr;
    }
    return total;
  }, [paymentType, annuityPayment, n, effectiveLoan, r]);

  const overpay = totalPay - effectiveLoan;
  const overpayPct = effectiveLoan > 0 ? Math.round((overpay / effectiveLoan) * 100) : 0;
  const principalPct = totalPay > 0 ? Math.round((effectiveLoan / totalPay) * 100) : 75;

  // График платежей
  const schedule = useMemo<ScheduleRow[]>(() => {
    const rows: ScheduleRow[] = [];
    let bal = effectiveLoan;
    const now = new Date();
    for (let i = 1; i <= n; i++) {
      const interest = bal * r;
      let principal: number;
      let pay: number;
      if (paymentType === "annuity") {
        pay = annuityPayment;
        principal = pay - interest;
      } else {
        principal = effectiveLoan / n;
        pay = principal + bal * r;
      }
      bal = Math.max(0, bal - principal);
      const d = new Date(now);
      d.setMonth(now.getMonth() + i);
      rows.push({ date: d, payment: pay, interest, principal, balance: bal });
    }
    return rows;
  }, [effectiveLoan, n, r, paymentType, annuityPayment]);

  const lastDate = schedule[schedule.length - 1]?.date;
  const totals = schedule.reduce(
    (a, row) => ({ pay: a.pay + row.payment, int: a.int + row.interest, pr: a.pr + row.principal }),
    { pay: 0, int: 0, pr: 0 }
  );

  // Какие строки показывать
  const visibleRows = useMemo(() => {
    if (showAll) return schedule;
    const first = schedule.slice(0, 5);
    const last = schedule.slice(Math.max(schedule.length - 3, 5));
    return { first, last };
  }, [schedule, showAll]);

  const inputCls = "w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400";
  const smallInputCls = "w-28 text-sm px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Левый блок — параметры */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Параметры</h3>

          <div className="space-y-4">
            {/* Тип */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Тип</label>
              <PillGroup
                options={[{ value: "consumer", label: "Кредит" }, { value: "mortgage", label: "Ипотека" }]}
                value={mode}
                onChange={(v) => { setMode(v); }}
              />
            </div>

            {/* Ипотечные поля */}
            {mode === "mortgage" && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Стоимость жилья (EUR)</label>
                  <input type="number" value={propValue} step={1000} min={10000}
                    onChange={(e) => setPropValue(Number(e.target.value))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Первоначальный взнос (EUR)</label>
                  <input type="number" value={downPayment} step={1000} min={0}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className={inputCls} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>LTV: <strong className={ltv > 80 ? "text-rose-600" : "text-slate-900"}>{ltv}%</strong></span>
                  <Tooltip text="LTV (Loan-to-Value) — отношение суммы кредита к стоимости жилья. Большинство банков Сербии: макс. 80% LTV." />
                  {ltv > 80 && <span className="text-rose-600">— превышает макс. 80%</span>}
                  <span className="ml-auto text-slate-500">Кредит: <strong>{fmt(effectiveLoan)} EUR</strong></span>
                </div>
              </div>
            )}

            {/* Сумма кредита (только для потребкредита) */}
            {mode === "consumer" && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Сумма кредита</label>
                <input type="number" value={loanAmount} step={500} min={500}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className={inputCls} />
              </div>
            )}

            {/* Валюта */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Валюта</label>
              <PillGroup
                options={[{ value: "EUR", label: "EUR" }, { value: "RSD", label: "RSD" }]}
                value={currency}
                onChange={setCurrency}
              />
            </div>

            {/* Срок */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Срок: <strong className="text-slate-900">{termYears}</strong> лет
              </label>
              <input type="range" min={1} max={30} step={1} value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full accent-blue-600" />
            </div>

            {/* Тип ставки */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Тип ставки</label>
              <PillGroup
                options={[
                  { value: "fixed", label: "Фиксированная" },
                  { value: "variable", label: "Переменная" },
                  { value: "combined", label: "Комбинированная" },
                ]}
                value={rateType}
                onChange={setRateType}
              />
            </div>

            {/* Фиксированная ставка */}
            {rateType === "fixed" && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Ставка: <strong className="text-slate-900">{fixedRate.toFixed(2)}%</strong>
                </label>
                <input type="range" min={1} max={25} step={0.25} value={fixedRate}
                  onChange={(e) => setFixedRate(parseFloat(e.target.value))}
                  className="w-full accent-blue-600" />
              </div>
            )}

            {/* Переменная ставка */}
            {rateType === "variable" && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">База</label>
                  <PillGroup
                    options={[
                      { value: "EURIBOR 3M", label: "EURIBOR 3M" },
                      { value: "EURIBOR 6M", label: "EURIBOR 6M" },
                      { value: "Belibor 3M", label: "Belibor 3M" },
                    ]}
                    value={rateBase}
                    onChange={setRateBase}
                  />
                </div>
                <div className="flex gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Значение базы (%)</label>
                    <input type="number" value={baseValue} step={0.01} min={0}
                      onChange={(e) => setBaseValue(parseFloat(e.target.value) || 0)}
                      className={smallInputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Маржа банка (+%)</label>
                    <input type="number" value={margin} step={0.01} min={0}
                      onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                      className={smallInputCls} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Итоговая ставка: <strong className="text-slate-900">{(baseValue + margin).toFixed(2)}%</strong>
                  &nbsp;({rateBase} + {margin}%)
                </p>
              </div>
            )}

            {/* Комбинированная ставка */}
            {rateType === "combined" && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Фиксированная ставка первые <strong>{fixPeriodYears}</strong> лет: <strong>{fixPeriodRate.toFixed(2)}%</strong>
                  </label>
                  <input type="range" min={1} max={15} step={0.25} value={fixPeriodRate}
                    onChange={(e) => setFixPeriodRate(parseFloat(e.target.value))}
                    className="w-full accent-blue-600" />
                  <input type="range" min={1} max={10} step={1} value={fixPeriodYears}
                    onChange={(e) => setFixPeriodYears(Number(e.target.value))}
                    className="w-full accent-slate-400 mt-2" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">База после фикс. периода</label>
                  <PillGroup
                    options={[{ value: "EURIBOR 3M", label: "EURIBOR 3M" }, { value: "EURIBOR 6M", label: "EURIBOR 6M" }]}
                    value={combinedBase}
                    onChange={setCombinedBase}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Маржа банка (+%)</label>
                  <input type="number" value={combinedMargin} step={0.01} min={0}
                    onChange={(e) => setCombinedMargin(parseFloat(e.target.value) || 0)}
                    className={smallInputCls} />
                </div>
                <p className="text-xs text-slate-400">
                  Расчёт ведётся по фикс. ставке на весь срок. Переменная часть для справки.
                </p>
              </div>
            )}

            {/* Тип платежей */}
            <div>
              <label className="flex items-center text-xs text-slate-500 mb-1">
                Тип платежей
                <Tooltip text="Аннуитетный: одинаковый платёж каждый месяц. Удобно планировать. Дифференцированный: первые платежи выше, последние ниже. Итоговая переплата меньше." />
              </label>
              <PillGroup
                options={[
                  { value: "annuity", label: "Аннуитетный" },
                  { value: "diff", label: "Дифференцированный" },
                ]}
                value={paymentType}
                onChange={setPaymentType}
              />
            </div>
          </div>
        </div>

        {/* Правый блок — результат */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Результат</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Платёж в месяц</p>
              <p className="text-xl font-semibold text-blue-600">{fmt(payment)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Переплата</p>
              <p className="text-xl font-semibold text-rose-600">{fmt(overpay)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Общая сумма</p>
              <p className="text-xl font-semibold text-slate-900">{fmt(totalPay)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 mb-1">Переплата %</p>
              <p className="text-xl font-semibold text-slate-900">{overpayPct}%</p>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-blue-600" style={{ width: `${principalPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${100 - principalPct}%` }} />
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500 mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />Основной долг</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Проценты</span>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Тип ставки</span>
              <span className="text-slate-700">
                {rateType === "fixed" ? "Фиксированная" : rateType === "variable" ? "Переменная" : "Комбинированная"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Тип платежей</span>
              <span className="text-slate-700">{paymentType === "annuity" ? "Аннуитетный" : "Дифференцированный"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Последний платёж</span>
              <span className="text-slate-700">
                {lastDate?.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Нижний блок — график платежей */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">График платежей</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Дата</th>
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Платёж</th>
                <th className="text-left py-2 px-2 text-rose-400 font-medium">Проценты</th>
                <th className="text-left py-2 px-2 text-blue-400 font-medium">Осн. долг</th>
                <th className="text-left py-2 px-2 text-slate-400 font-medium">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {(showAll
                ? schedule
                : (visibleRows as { first: ScheduleRow[]; last: ScheduleRow[] }).first
              ).map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-1.5 px-2 text-slate-600">
                    {row.date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                  </td>
                  <td className="py-1.5 px-2 font-medium text-slate-900">{fmt(row.payment)}</td>
                  <td className="py-1.5 px-2 text-rose-600">{fmt(row.interest)}</td>
                  <td className="py-1.5 px-2 text-blue-600">{fmt(row.principal)}</td>
                  <td className="py-1.5 px-2 text-slate-700">{fmt(row.balance)}</td>
                </tr>
              ))}

              {!showAll && schedule.length > 8 && (
                <>
                  <tr>
                    <td colSpan={5} className="py-2 text-center text-slate-300 text-xs">...</td>
                  </tr>
                  {(visibleRows as { first: ScheduleRow[]; last: ScheduleRow[] }).last.map((row, i) => (
                    <tr key={`last-${i}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-slate-600">
                        {row.date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-900">{fmt(row.payment)}</td>
                      <td className="py-1.5 px-2 text-rose-600">{fmt(row.interest)}</td>
                      <td className="py-1.5 px-2 text-blue-600">{fmt(row.principal)}</td>
                      <td className="py-1.5 px-2 text-slate-700">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </>
              )}

              {/* Итого */}
              <tr className="bg-slate-50 font-medium">
                <td className="py-2 px-2 text-slate-900">Итого</td>
                <td className="py-2 px-2 text-slate-900">{fmt(totals.pay)}</td>
                <td className="py-2 px-2 text-rose-600">{fmt(totals.int)}</td>
                <td className="py-2 px-2 text-blue-600">{fmt(totals.pr)}</td>
                <td className="py-2 px-2 text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full text-center text-xs text-blue-600 hover:text-blue-700 py-2 border-t border-slate-100"
        >
          {showAll ? "Свернуть" : `Показать все ${schedule.length} платежей`}
        </button>
      </div>
    </div>
  );
}