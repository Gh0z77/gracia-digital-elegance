import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_TAGS,
  readLocaleCookie,
  type Locale,
} from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionary";

export * from "./config";
export type { Dictionary } from "./dictionary";

type I18nValue = {
  locale: Locale;
  /** The dictionary itself, so `t.nav.home` is checked by the compiler. */
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  // Seeded from the server's detection, then owned by the client so switching
  // languages never needs a round trip or a reload.
  const [current, setCurrent] = useState<Locale>(locale);

  const setLocale = useCallback((next: Locale) => {
    setCurrent(next);
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = LOCALE_TAGS[next];
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale: current, t: DICTIONARIES[current], setLocale }),
    [current, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}

/** Fills `{name}` placeholders: fmt(t.menu.added, { dish: "Lasagna" }). */
export function fmt(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Locale for code that runs outside React — route `head()` functions build their
 * meta tags before the provider exists, so they read the cookie directly and
 * fall back to the default during SSR.
 */
export function currentLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  return readLocaleCookie(document.cookie) ?? DEFAULT_LOCALE;
}

export function dict(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/**
 * Dictionary for a route's `head()`. The root route's `beforeLoad` puts the
 * locale on the match context, which is the only place `head()` can reach it —
 * it runs outside React, before any provider exists.
 */
export function headDict(match: { context?: unknown }): Dictionary {
  const locale = (match.context as { locale?: Locale } | undefined)?.locale;
  return DICTIONARIES[locale ?? DEFAULT_LOCALE];
}
