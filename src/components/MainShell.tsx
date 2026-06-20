// src/components/MainShell.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";

// Зеркалит ту же проверку, что и StickyHeader: на голом лендинге системный
// хедер скрыт, поэтому верхний отступ под фиксированный хедер тоже не нужен —
// иначе перед собственным навбаром LandingPage остаётся пустая полоса.
export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBareLanding = pathname === "/" && !searchParams.get("tab");

  return (
    <main className={isBareLanding ? "pb-16" : "pt-20 pb-16"}>
      {children}
    </main>
  );
}