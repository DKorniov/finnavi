// src/app/layout.tsx
import { cookies } from "next/headers";
import { ResidencyProvider } from "@/components/ResidencyProvider";
import { StickyHeader } from "@/components/StickyHeader";
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
  
  // 🔥 ЭТАЛОННЫЙ ДЕФОЛТ: Если куки не заданы, открываем как Нерезидент + Физическое лицо
  const initialStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const initialLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  return (
    <html lang="ru">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Прокидываем оба стартовых значения в клиентский контекст */}
        <ResidencyProvider initialStatus={initialStatus} initialLegalType={initialLegalType}>
          <StickyHeader />
          <main className="pt-20 pb-16">
            {children}
          </main>
        </ResidencyProvider>
      </body>
    </html>
  );
}