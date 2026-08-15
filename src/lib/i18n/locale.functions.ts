import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  localeFromAcceptLanguage,
  localeFromCountry,
  readLocaleCookie,
  type Locale,
} from "./config";

/**
 * Resolves the visitor's language on the server, in order of how much each
 * signal actually tells us:
 *
 *   1. the cookie — an explicit choice, and it always wins;
 *   2. Accept-Language — what their device is configured to read;
 *   3. the edge's country header — a last resort for visitors whose browser
 *      sends nothing useful.
 *
 * Country deliberately ranks below Accept-Language: a Russian-speaking guest in
 * Andijan and an English-speaking one are both in UZ, and only the header can
 * tell them apart.
 */
export const detectLocale = createServerFn({ method: "GET" }).handler(async (): Promise<Locale> => {
  const stored = getCookie(LOCALE_COOKIE);
  if (isLocale(stored)) return stored;

  const country =
    getRequestHeader("cf-ipcountry") ??
    getRequestHeader("x-vercel-ip-country") ??
    getRequestHeader("x-nf-client-connection-ip-country");

  const locale =
    localeFromAcceptLanguage(getRequestHeader("accept-language")) ??
    localeFromCountry(country) ??
    DEFAULT_LOCALE;

  // Pin it now so hydration on the client reads back exactly what was rendered,
  // instead of re-guessing and swapping the language under the visitor.
  setCookie(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  return locale;
});

function localeFromNavigator(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return localeFromAcceptLanguage(languages.filter(Boolean).join(","));
}

/**
 * Used by the root route's `beforeLoad`. On the server this runs the detection
 * above in-process; on the client it reads the cookie the server just set, so a
 * client-side navigation never costs a round trip.
 */
export async function resolveLocale(): Promise<Locale> {
  if (typeof document !== "undefined") {
    return readLocaleCookie(document.cookie) ?? localeFromNavigator() ?? DEFAULT_LOCALE;
  }
  return detectLocale();
}
