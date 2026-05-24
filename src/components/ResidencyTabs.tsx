"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ResidencyTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Берем текущий статус из URL или ставим по умолчанию non_resident
  const currentStatus = searchParams.get("status") || "non_resident";

  const handleValueChange = (value: string) => {
    // При клике обновляем URL: ?status=...
    router.push(`/?status=${value}`);
  };

  const tabs = [
    { id: "non_resident", label: "Нерезидент" },
    { id: "resident_less_1y", label: "ВНЖ < 1 года" },
    { id: "resident_more_1y", label: "Резидент 12 мес+" },
  ];

  return (
    <div className="flex flex-col gap-4 mb-8">
      <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider text-center md:text-left">
        Ваш текущий статус в Сербии:
      </h2>
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full max-w-lg mx-auto md:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleValueChange(tab.id)}
            className={`flex-1 py-2 px-2 md:px-4 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
              currentStatus === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}