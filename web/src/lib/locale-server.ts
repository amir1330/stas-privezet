import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale, isLocale } from "@/lib/api";

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
