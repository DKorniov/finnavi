// src/components/Calculators/CalculatorsTab.tsx
"use client";

import { useState } from "react";
import { DepositCalculator } from "@/components/Calculators/DepositCalculator";
import { CreditCalculator } from "@/components/Calculators/CreditCalculator";

type CalcTab = "deposit" | "credit";

export function CalculatorsTab() {
  const [activeTab, setActiveTab] = useState<CalcTab>("deposit");

  return (
    <div>
      {/* Подвкладки */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "deposit"
              ? "border-emerald-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Вклады
        </button>
        <button
          onClick={() => setActiveTab("credit")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "credit"
              ? "border-emerald-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Кредиты / Ипотека
        </button>
      </div>

      {activeTab === "deposit" && <DepositCalculator />}
      {activeTab === "credit" && <CreditCalculator />}
    </div>
  );
}