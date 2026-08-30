"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, type Locale, isLocale } from "@/lib/api";
import en from "@/i18n/messages/en.json";
import kk from "@/i18n/messages/kk.json";
import ru from "@/i18n/messages/ru.json";

const MESSAGES = { ru, en, kk } as const;

type Messages = typeof ru;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Messages) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => String(key),
});

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|; )locale=([^;]+)/);
  const value = match?.[1];
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readCookieLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
    setLocaleState(next);
    window.location.reload();
  }, []);

  const t = useCallback(
    (key: keyof Messages) => MESSAGES[locale][key] ?? MESSAGES.ru[key] ?? String(key),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
