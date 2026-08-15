export function formatSom(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " so'm";
}

export const MENU_CATEGORIES = [
  "Starters",
  "Main Courses",
  "Pizza",
  "Pasta",
  "Desserts",
  "Beverages",
] as const;

export const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

export const RESTAURANT_TIME_ZONE = "Asia/Tashkent";

/**
 * `YYYY-MM-DD` for today *at the restaurant*. `toISOString().slice(0, 10)` would
 * return the UTC day, which is yesterday in Andijan (UTC+5) until 05:00 local —
 * long enough to hide same-day bookings every single morning.
 */
export function todayAtRestaurant(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "Fri, 14 Aug 2026" — for confirmations, where a bare ISO date reads coldly. */
export function formatLongDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/* -------------------------------------------------------------------------- */
/* Phone                                                                       */
/* -------------------------------------------------------------------------- */

const UZ_NATIONAL_DIGITS = 9;

/** Progressive formatter for the booking input: "+998 99 609 99 99". */
export function formatUzPhone(raw: string): string {
  const national = raw.replace(/\D/g, "").replace(/^998/, "").slice(0, UZ_NATIONAL_DIGITS);
  const groups = [
    national.slice(0, 2),
    national.slice(2, 5),
    national.slice(5, 7),
    national.slice(7, 9),
  ].filter(Boolean);
  return groups.length ? `+998 ${groups.join(" ")}` : "+998 ";
}

/** `+998996099999` — the shape the database CHECK constraint expects. */
export function toE164Uz(raw: string): string {
  return `+998${raw.replace(/\D/g, "").replace(/^998/, "").slice(0, UZ_NATIONAL_DIGITS)}`;
}

export function isCompleteUzPhone(raw: string): boolean {
  return /^\+998\d{9}$/.test(toE164Uz(raw));
}

/** Strips spaces for `tel:` hrefs. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

/* -------------------------------------------------------------------------- */
/* Row types                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The `_uz` / `_ru` columns are optional on purpose: they only exist once the
 * localisation migration has run, and `localized()` falls back to the base
 * column until then.
 */
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  description_uz?: string;
  description_ru?: string;
  category: string;
  price: number;
  image_url: string;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

export type Reservation = {
  id: string;
  full_name: string;
  phone: string;
  guests: number;
  reserved_date: string;
  reserved_time: string;
  notes: string;
  status: string;
  created_at: string;
  /** Chosen from the floor plan. Null when the restaurant will seat the party. */
  table_code: string | null;
};

export type SiteSettings = {
  id: number;
  hero_title: string;
  hero_title_uz?: string;
  hero_title_ru?: string;
  phone: string;
  address: string;
  address_uz?: string;
  address_ru?: string;
  hours: string;
  hours_uz?: string;
  hours_ru?: string;
  instagram: string;
};

/** Fields the control room offers a translation box for. */
export const LOCALISED_SETTINGS = ["hero_title", "address", "hours"] as const;
