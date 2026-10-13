import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { TooltipProvider } from "@/frontend/design-system/components/ui/tooltip";
import { SCRIPT_TEMA } from "@/frontend/features/app/tema";
import "./globals.css";

// Fonte dos títulos do design system (tokens.css usa --font-outfit).
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cockpit The Senses",
  description: "Vendas, contratos e indicadores do The Senses Wellness Club.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o SCRIPT_TEMA pode pôr data-theme no <html> antes do React.
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
