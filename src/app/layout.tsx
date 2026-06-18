// src/app/layout.tsx
import { cookies } from "next/headers";
import { ResidencyProvider } from "@/components/ResidencyProvider";
import { StickyHeader } from "@/components/StickyHeader";
import { OnboardingSheet } from "@/components/OnboardingSheet";
import type { ResidencyStatus, LegalType } from "@/types/bank";
import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://finnavi.rs";

export const metadata: Metadata = {
  title: "ExpatFinance Navigator — Финансовый хаб в Сербии",
  description: "Матрица банков по вашему ВНЖ, сравнение вкладов и брокеров, справочник по налогам. На основе официальных тарифов и опыта экспат-сообщества.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "ExpatFinance Navigator",
    title: "ExpatFinance Navigator — Финансы в Сербии без месяца поиска по форумам",
    description: "Матрица банков по вашему ВНЖ, сравнение вкладов и брокеров, справочник по налогам.",
    images: [
      {
        url: "/og-image.png",   // → public/og-image.png, 1200×630px
        width: 1200,
        height: 630,
        alt: "ExpatFinance Navigator",
      },
    ],
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpatFinance Navigator — Финансы в Сербии",
    description: "Матрица банков по вашему ВНЖ, сравнение вкладов и брокеров, справочник по налогам.",
    images: ["/og-image.png"],
  },
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