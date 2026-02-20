export const locales = ["me", "en", "it", "sq"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  me: "Crnogorski",
  en: "English",
  it: "Italiano",
  sq: "Shqip",
};

export const localeFlags: Record<Locale, string> = {
  me: "🇲🇪",
  en: "🇬🇧",
  it: "🇮🇹",
  sq: "🇦🇱",
};
