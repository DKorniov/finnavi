"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResidency } from "./ResidencyProvider";
import type { ResidencyStatus } from "@/types/database";

export function StickyHeader() {
  const pathname = usePathname();
  // Достаем legalType и setLegalType из глобального провайдера
  const { status, setStatus, legalType, setLegalType } = useResidency();

  const navLinks = [
    { href: "/accounts", label: "Счета" },
    { href: "/savings", label: "Вклады" },
    { href: "/invest", label: "Инвестиции" },
    { href: "/taxes", label: "Налоги" },
    { href: "/services", label: "Услуги" },
  ];

  const tabs: { id: ResidencyStatus; label: string }[] = [
    { id: "non_resident", label: "Нерезидент" },
    { id: "resident_less_1y", label: "ВНЖ < 1г" },
    { id: "resident_more_1y", label: "Резидент 1г+" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2 shrink-0">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm">EF</span>
          <span className="hidden md:inline text-slate-900">ExpatFinance</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isActive ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Уровень 1: Физлицо vs ИП */}
          <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold">
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

          {/* Уровень 2: Статус */}
          {legalType === "individual" && (
            <div className="flex bg-blue-50 border border-blue-100 p-0.5 rounded-lg text-xs font-medium">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    status === tab.id ? "bg-blue-600 text-white shadow-xs font-semibold" : "text-blue-700 hover:bg-blue-100/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {legalType === "business" && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg animate-fade-in">
              Фильтр: Юрлица
            </span>
          )}
        </div>
      </div>
    </header>
  );
}