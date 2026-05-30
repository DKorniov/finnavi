import { cookies } from "next/headers";
import { ResidencyProvider } from "@/components/ResidencyProvider";
import { StickyHeader } from "@/components/StickyHeader";
import type { ResidencyStatus } from "@/types/database";
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
  // По умолчанию отдаем 'non_resident' для SEO-индексации поисковиками
  const initialStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;

  return (
    <html lang="ru">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ResidencyProvider initialStatus={initialStatus}>
          {/* Сквозной Sticky Header для всех страниц */}
          <StickyHeader />
          <main className="pt-20 pb-16">
            {children}
          </main>
        </ResidencyProvider>
      </body>
    </html>
  );
}
