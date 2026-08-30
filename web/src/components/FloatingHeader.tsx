"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBag, IconHeart, IconSearch, IconUser } from "@/components/HeaderIcons";
import { LOCALES, type Locale } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { useProductChrome } from "@/lib/product-chrome";

const LOCALE_LABELS: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  kk: "KK",
};

function HeaderIconLink({
  href,
  label,
  children,
  accent,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`anim-header-icon flex items-center justify-center rounded-full transition-colors hover:bg-black/5 ${
        accent
          ? "unicorn-cart-btn unicorn-cart-btn-lg text-white hover:bg-[var(--color-cart-pink)]"
          : "h-10 w-10 text-[#222]"
      }`}
    >
      {children}
    </Link>
  );
}

export function FloatingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const { isProductPage, isCompact } = useProductChrome();

  const desktopNav = [
    { href: "/catalog", label: t("catalog"), icon: true },
    { href: "/support", label: t("about") },
    { href: "/support", label: t("reviews") },
  ];

  const mobileNav = [
    { href: "/catalog", label: t("catalog") },
    { href: "/catalog?in_stock=true", label: t("inStock") },
    { href: "/support", label: t("about") },
    { href: "/support", label: t("reviews") },
    { href: "/login", label: t("account") },
  ];

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={[
          "unicorn-site-header z-50 transition-all duration-300 ease-in-out",
          isProductPage
            ? isCompact
              ? "fixed top-0 left-0 right-0 -translate-y-full opacity-0 pointer-events-none"
              : "relative"
            : "sticky top-0",
        ].join(" ")}
      >
        <div className="relative flex items-center justify-between px-3 pb-3 pt-[19px] lg:hidden">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Открыть меню"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
            >
              <span className="block h-[2px] w-5 rounded-full bg-black" />
              <span className="block h-[2px] w-5 rounded-full bg-black" />
              <span className="block h-[2px] w-5 rounded-full bg-black" />
            </button>
            <Link href="/search" aria-label={t("search")} className="flex h-10 w-10 items-center justify-center">
              <IconSearch />
            </Link>
          </div>

          <Link
            href="/"
            className="absolute left-1/2 max-w-[52vw] -translate-x-1/2 truncate text-[15px] font-extrabold tracking-[0.01em] text-black"
          >
            {t("siteName")}
          </Link>

          <HeaderIconLink href="/login" label={t("cart")} accent>
            <IconBag size={20} />
          </HeaderIconLink>
        </div>

        <div className="mx-auto hidden max-w-[1400px] items-center justify-between gap-6 px-4 pb-4 pt-5 lg:flex">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <Link href="/" className="shrink-0 text-lg font-extrabold tracking-[0.01em] text-black">
              {t("siteName")}
            </Link>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {desktopNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="anim-nav-pill inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-[#222]"
                >
                  {item.icon && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                    </svg>
                  )}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <div className="mr-1 flex rounded-full bg-[#f2f2f2] p-0.5">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    locale === loc ? "bg-white text-black shadow-sm" : "text-[#717171]"
                  }`}
                  aria-label={`${t("language")}: ${LOCALE_LABELS[loc]}`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
            <HeaderIconLink href="/login" label={t("profile")}>
              <IconUser />
            </HeaderIconLink>
            <HeaderIconLink href="/catalog" label={t("favorites")}>
              <IconHeart />
            </HeaderIconLink>
            <HeaderIconLink href="/login" label={t("cart")} accent>
              <IconBag />
            </HeaderIconLink>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="anim-menu-overlay absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="anim-menu-panel absolute left-0 top-0 flex h-full w-[min(300px,85vw)] flex-col bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-extrabold">{t("siteName")}</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="p-2">
                ✕
              </button>
            </div>
            <div className="mb-4 flex gap-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    locale === loc ? "bg-black text-white" : "bg-[#f2f2f2]"
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
            {mobileNav.map((l) => (
              <Link
                key={`${l.href}-${l.label}`}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-black/5 py-4 text-base font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
