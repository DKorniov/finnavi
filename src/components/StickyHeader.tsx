"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useResidency } from "./ResidencyProvider";
import type { ResidencyStatus } from "@/types/bank";

const TABS: { id: ResidencyStatus; label: string }[] = [
  { id: "non_resident",       label: "Нерезидент"   },
  { id: "resident_less_1y",   label: "ВНЖ < 1г"     },
  { id: "resident_more_1y",   label: "Резидент 1г+"  },
  { id: "permanent_resident", label: "ПМЖ"           },
  { id: "citizen",            label: "Гражданин"     },
];

export function StickyHeader() {
  const { status, setStatus } = useResidency();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем dropdown при клике вне него
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = TABS.find(t => t.id === status)?.label ?? "Статус";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs overflow-visible">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Логотип */}
        <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900">
          Expat<span className="text-emerald-500">Finance</span>
        </Link>

        {/* Desktop: pill-кнопки */}
        <div className="hidden lg:flex bg-blue-50 border border-blue-100 p-0.5 rounded-lg text-xs font-medium">
          {TABS.map((tab) => (
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

        {/* Mobile: dropdown */}
        <div className="relative lg:hidden" ref={dropdownRef}>
          <button
            onClick={() => setOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              open
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {currentLabel}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] overflow-y-auto max-h-[calc(100vh-80px)]">
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky top-0 bg-white">
                Статус резидентства
              </div>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setStatus(tab.id); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                    status === tab.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  {status === tab.id && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}