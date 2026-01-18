export const locales = ["me", "en", "it", "sq"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "me";

export const localeNames: Record<Locale, string> = {
  me: "Crnogorski",
  en: "English",
  it: "Italiano",
  sq: "Shqip",
};

export const localeFlags: Record<Locale, string> = {
  me: "https://flagcdn.com/w20/me.png",
  en: "https://flagcdn.com/w20/gb.png",
  it: "https://flagcdn.com/w20/it.png",
  sq: "https://flagcdn.com/w20/al.png",
};
