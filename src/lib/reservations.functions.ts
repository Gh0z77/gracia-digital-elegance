import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { clientKey } from "./admin.server";
import { FLOOR_TABLES, findTable, tableFitsParty, type FloorZone } from "./floor-plan";
import { RESTAURANT_TIME_ZONE } from "./format";
import { formatBookingNotice, sendTelegramMessage } from "./telegram.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), "invalid date");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/**
 * Which tables are already spoken for at a given sitting.
 *
 * Guests may not read the reservations table — that is a row of names and phone
 * numbers — so availability comes back as nothing but a list of table codes.
 * Deliberately no `id`, no `full_name`, no count of the party.
 */
export const tableAvailability = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ date: dateSchema, time: timeSchema }).parse(data))
  .handler(async ({ data }): Promise<{ taken: string[] }> => {
    const { data: rows, error } = await supabaseAdmin
      .from("reservations")
      .select("table_code")
      .eq("reserved_date", data.date)
      .eq("reserved_time", data.time)
      .neq("status", "cancelled")
      .not("table_code", "is", null);

    if (error) throw new Error(error.message);

    const taken = (rows ?? [])
      .map((row) => (row as { table_code: string | null }).table_code)
      .filter((code): code is string => Boolean(code));

    return { taken: [...new Set(taken)] };
  });

/* -------------------------------------------------------------------------- */
/* Booking                                                                     */
/* -------------------------------------------------------------------------- */

const NOTES_LIMIT = 500;

const bookingSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  // Accepted in the spaced form the field produces; normalised below.
  phone: z.string().trim().min(9).max(40),
  guests: z.number().int().min(1).max(30),
  reserved_date: dateSchema,
  reserved_time: timeSchema,
  notes: z.string().trim().max(NOTES_LIMIT).default(""),
  table_code: z
    .union([z.string().regex(/^[A-Z]{1,2}\d{1,2}$/), z.literal("")])
    .default("")
    .transform((value) => value || null),
  locale: z.enum(["uz", "ru", "en"]).default("uz"),
});

export type BookingResult =
  | { ok: true; tableCode: string | null }
  | { ok: false; reason: "table_taken" | "invalid" | "throttled" | "failed" };

// The form is unauthenticated, so the only thing standing between it and a
// script is this. Generous enough that a family booking two tables in a row is
// never caught, tight enough that the dining room cannot be filled with junk.
const BOOKING_WINDOW_MS = 10 * 60 * 1000;
const MAX_BOOKINGS_PER_WINDOW = 6;
const bookings = new Map<string, { count: number; firstAt: number }>();

function bookingThrottled(key: string): boolean {
  const now = Date.now();
  for (const [entryKey, entry] of bookings) {
    if (now - entry.firstAt > BOOKING_WINDOW_MS) bookings.delete(entryKey);
  }
  const entry = bookings.get(key);
  if (!entry || now - entry.firstAt > BOOKING_WINDOW_MS) {
    bookings.set(key, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_BOOKINGS_PER_WINDOW;
}

/** Today where the restaurant is, which is not today where the server is. */
function todayAtRestaurant(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RESTAURANT_TIME_ZONE }).format(new Date());
}

function shiftDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const ZONE_UZ: Record<FloorZone, string> = {
  terrace: "Terasa",
  hall: "Asosiy zal",
  kids: "Bolalar zonasi",
  private: "Alohida xona",
};

// Postgres unique_violation — here it can only be the one-table-one-sitting index.
const UNIQUE_VIOLATION = "23505";

/**
 * Takes a booking.
 *
 * This runs on the server rather than inserting straight from the browser for
 * three reasons: the chosen table has to be checked against the real floor plan,
 * the double-booking race has to be resolved by the database, and the restaurant
 * has to be told. The row-level security policy still stands behind all of this
 * for anything that talks to PostgREST directly.
 */
export const submitReservation = createServerFn({ method: "POST" })
  .validator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }): Promise<BookingResult> => {
    if (bookingThrottled(clientKey())) return { ok: false, reason: "throttled" };

    const phone = data.phone.replace(/\s+/g, "");
    if (!/^\+998\d{9}$/.test(phone)) return { ok: false, reason: "invalid" };

    const today = todayAtRestaurant();
    if (data.reserved_date < today) return { ok: false, reason: "invalid" };
    if (data.reserved_date > shiftDays(today, 365)) return { ok: false, reason: "invalid" };

    // A table the guest cannot actually have — retired since the page loaded, or
    // hand-typed into the request — is refused rather than quietly dropped.
    const table = data.table_code ? findTable(data.table_code) : undefined;
    if (data.table_code && !table) return { ok: false, reason: "invalid" };
    if (table && !tableFitsParty(table, data.guests)) return { ok: false, reason: "invalid" };

    const { error } = await supabaseAdmin.from("reservations").insert({
      full_name: data.full_name,
      phone: data.phone,
      guests: data.guests,
      reserved_date: data.reserved_date,
      reserved_time: data.reserved_time,
      notes: data.notes,
      table_code: data.table_code,
      // The service role is not bound by the insert policy, so the guarantee it
      // carries — a public request is only ever a request — is restated here.
      status: "pending",
    } as never);

    if (error) {
      if (error.code === UNIQUE_VIOLATION) return { ok: false, reason: "table_taken" };
      console.error(`[reservation] insert failed: ${error.message}`);
      return { ok: false, reason: "failed" };
    }

    // Awaited, not fired and forgotten: a serverless instance is free to stop
    // executing the moment the response is returned, which would drop the
    // message. It has its own short timeout and never throws.
    await sendTelegramMessage(
      formatBookingNotice({
        fullName: data.full_name,
        phone: data.phone,
        guests: data.guests,
        date: data.reserved_date,
        time: data.reserved_time,
        notes: data.notes,
        tableCode: table?.code ?? null,
        tableLabel: table ? `${ZONE_UZ[table.zone]} · ${table.seats} o‘rin` : null,
        locale: data.locale,
      }),
    );

    return { ok: true, tableCode: table?.code ?? null };
  });

/** Every table the plan knows about, for the guest-facing floor drawing. */
export const FLOOR_TABLE_CODES = FLOOR_TABLES.map((table) => table.code);
