"use client";

import { useLocale } from "@/lib/locale";

export function HomeGuaranteeLine() {
  const { t } = useLocale();
  return <h3 className="unicorn-guarantee">{t("guarantee")}</h3>;
}
