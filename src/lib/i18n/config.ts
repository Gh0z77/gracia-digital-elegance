export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "gracia-lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  uz: { short: "UZ", full: "O‘zbekcha" },
  ru: { short: "RU", full: "Русский" },
  en: { short: "EN", full: "English" },
};

/** BCP-47 tags for <html lang> and Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Countries where Russian is the language a visitor most likely reads. Uzbek is
 * the default for Uzbekistan itself; everywhere else falls back to English.
 */
const RUSSIAN_SPEAKING = new Set(["RU", "KZ", "KG", "TJ", "BY", "AM", "AZ", "MD", "GE", "TM"]);

export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  if (code === "UZ") return "uz";
  if (RUSSIAN_SPEAKING.has(code)) return "ru";
  // Somebody browsing from outside the region whose device language we don't
  // speak is far better served by English than by the local default.
  return "en";
}

/**
 * Picks the best supported locale from an Accept-Language header, honouring the
 * quality values so `ru;q=0.9, en;q=0.8` resolves to Russian rather than to
 * whichever tag happened to be listed first.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "uz") return "uz";
    if (base === "ru") return "ru";
    if (base === "en") return "en";
    // Uzbek browsers are frequently configured in Karakalpak or Tajik; Russian
    // is the shared second language across all of them.
    if (base === "kaa" || base === "tg" || base === "kk" || base === "ky") return "ru";
  }
  return null;
}

/**
 * Reads a translated database column, e.g. `description_ru`, falling back to the
 * base English column whenever the translation is missing or blank. That keeps
 * the site readable before the localisation migration runs and for any dish a
 * manager has added but not yet translated.
 */
export function localized(
  row: Record<string, unknown> | null | undefined,
  field: string,
  locale: Locale,
): string {
  if (!row) return "";
  const base = typeof row[field] === "string" ? (row[field] as string) : "";
  if (locale === "en") return base;
  const translated = row[`${field}_${locale}`];
  return typeof translated === "string" && translated.trim() ? translated : base;
}

export function readLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === LOCALE_COOKIE) {
      const value = decodeURIComponent(rest.join("="));
      return isLocale(value) ? value : null;
    }
  }
  return null;
}
