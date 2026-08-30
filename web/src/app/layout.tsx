import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { FloatingHeader } from "@/components/FloatingHeader";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteConfig, themeCssVars } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNICORN — Оригинальные кроссовки",
  description: "Проверенные кроссовки. Оригинальность, размерная сетка, поддержка при покупке.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();

  return (
    <html lang="ru">
      <body
        className="min-h-screen bg-white font-sans"
        style={themeCssVars(config.theme) as CSSProperties}
      >
        <Providers>
          <FloatingHeader />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
