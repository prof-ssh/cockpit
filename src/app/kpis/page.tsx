import type { Metadata } from "next";
import { PaginaKpis } from "@/frontend/features/kpis/PaginaKpis";

export const metadata: Metadata = { title: "KPIs do Cockpit" };

export default function Page() {
  return <PaginaKpis />;
}
