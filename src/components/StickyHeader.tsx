"use client";

import Link from "next/link";
import { useResidency } from "./ResidencyProvider";
import type { ResidencyStatus } from "@/types/bank";

export function StickyHeader() {
  const { status, setStatus, legalType, setLegalType } = useResidency();

  const tabs: { id: ResidencyStatus; label: string }[] = [
    { id: "non_resident",       label: "Нерезидент" },
    { id: "resident_less_1y",   label: "ВНЖ < 1г"   },
    { id: "resident_more_1y",   label: "Резидент 1г+" },
    { id: "permanent_resident", label: "ПМЖ"         },
    { id: "citizen",            label: "Гражданин"   },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Логотип */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900">
            Expat<span className="text-emerald-500">Finance</span>
          </Link>
        </div>

        {/* Глобальные фильтры */}
        <div className="flex items-center gap-3">

          {/* Тип лица */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
            <button
              onClick={() => setLegalType("individual")}
              className={`px-2.5 py-1 rounded-md transition-all ${legalType === "individual" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
            >
              Физлицо
            </button>
            <button
              onClick={() => setLegalType("business")}
              className={`px-2.5 py-1 rounded-md transition-all ${legalType === "business" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
            >
              ИП / ООО
            </button>
          </div>

          {/* Статус резидентства */}
          {legalType === "individual" && (
            <div className="hidden lg:flex bg-blue-50 border border-blue-100 p-0.5 rounded-lg text-xs font-medium">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    status === tab.id
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-blue-700 hover:bg-blue-100/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
