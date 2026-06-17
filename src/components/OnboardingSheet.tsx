// src/components/OnboardingSheet.tsx
"use client";

import { useState } from "react";
import { useResidency } from "@/components/ResidencyProvider";
import type { ResidencyStatus } from "@/types/bank";

interface OnboardingSheetProps {
  isFirstVisit: boolean;
}

const STATUS_OPTIONS: { value: ResidencyStatus; label: string; sub: string }[] = [
  {
    value: "non_resident",
    label: "Нерезидент (турист)",
    sub: "Белый картон / штамп в паспорте",
  },
  {
    value: "resident_less_1y",
    label: "ВНЖ до 1 года",
    sub: "Privremeni boravak, первый год",
  },
  {
    value: "resident_more_1y",
    label: "Резидент 1+ год",
    sub: "Valutni rezident",
  },
  {
    value: "permanent_resident",
    label: "ПМЖ",
    sub: "Stalno nastanjenje",
  },
  {
    value: "citizen",
    label: "Гражданин Сербии",
    sub: "Паспорт РС или двойное гражданство",
  },
];

export function OnboardingSheet({ isFirstVisit }: OnboardingSheetProps) {
  const { setStatus } = useResidency();
  const [selected, setSelected] = useState<ResidencyStatus>("resident_less_1y");
  const [visible, setVisible] = useState(isFirstVisit);
  const [closing, setClosing] = useState(false);

  function close() {
    setClosing(true);
    setTimeout(() => setVisible(false), 280);
  }

  function handleConfirm() {
    setStatus(selected);
    close();
  }

  function handleSkip() {
    close();
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        style={{
          animation: closing
            ? "fadeOut 280ms ease forwards"
            : "fadeIn 200ms ease forwards",
        }}
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Выберите статус резидентства"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8 max-w-lg mx-auto font-sans"
        style={{
          animation: closing
            ? "slideDown 280ms ease forwards"
            : "slideUp 300ms ease forwards",
        }}
      >
        {/* Handle */}
        <div className="w-8 h-1 rounded-full bg-slate-200 mx-auto mb-5" />

        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Ваш статус в Сербии?
        </h2>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          Покажем только актуальные для вас банки и продукты
        </p>

        {/* Опции */}
        <div className="space-y-2 mb-5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                selected === opt.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  selected === opt.value ? "text-emerald-900" : "text-slate-900"
                }`}
              >
                {opt.label}
              </span>
              <span
                className={`block text-xs mt-0.5 ${
                  selected === opt.value ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {opt.sub}
              </span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Показать подходящие продукты →
        </button>

        <button
          onClick={handleSkip}
          className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Пропустить — смотреть всё
        </button>
      </div>

      <style>{`
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut  { from { opacity: 1 } to { opacity: 0 } }
        @keyframes slideUp  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes slideDown{ from { transform: translateY(0) } to { transform: translateY(100%) } }
      `}</style>
    </>
  );
}