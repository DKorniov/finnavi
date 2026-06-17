// src/app/layout.tsx
import { cookies } from "next/headers";
import { ResidencyProvider } from "@/components/ResidencyProvider";
import { StickyHeader } from "@/components/StickyHeader";
import { OnboardingSheet } from "@/components/OnboardingSheet"; // ← новый импорт
import type { ResidencyStatus, LegalType } from "@/types/bank";
import "./globals.css";

export const metadata = {
  title: "ExpatFinance Navigator — Финансовый хаб в Сербии",
  description: "Агрегатор банковских, инвестиционных и налоговых продуктов для экспатов",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const initialStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const initialLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  // Первый визит = кука expat_status ещё не была выставлена пользователем
  const isFirstVisit = !cookieStore.get("expat_status")?.value; // ← новая строка

  return (
    <html lang="ru">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ResidencyProvider initialStatus={initialStatus} initialLegalType={initialLegalType}>
          <StickyHeader />
          <OnboardingSheet isFirstVisit={isFirstVisit} /> {/* ← монтируем */}
          <main className="pt-20 pb-16">
            {children}
          </main>
        </ResidencyProvider>
      </body>
    </html>
  );
}