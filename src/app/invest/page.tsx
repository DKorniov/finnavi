// src/app/invest/page.tsx
import { redirect } from "next/navigation";

export default function InvestPage() {
  redirect("/?tab=investment_bonds&invest=brokers");
}