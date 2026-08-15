import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  clearAttempts,
  clientKey,
  getAdminSession,
  isThrottled,
  passcodeMatches,
  recordFailedAttempt,
  requireAdmin,
} from "./admin.server";
import type { MenuItem, Reservation, SiteSettings } from "./format";
import { telegramConfigured } from "./telegram.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Env the control room needs before it can do anything. Names only — never values. */
function missingAdminConfig(): string[] {
  const required = [
    "SESSION_SECRET",
    "ADMIN_PASSCODE",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  return required.filter((key) => !process.env[key]);
}

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const missingConfig = missingAdminConfig();
  // Reading the session needs SESSION_SECRET, so report the gap instead of
  // throwing an opaque 500 at an operator who just hasn't finished setup.
  if (missingConfig.length) return { unlocked: false, missingConfig };
  const session = await getAdminSession();
  return { unlocked: Boolean(session.data.unlocked), missingConfig };
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { passcode: string }) =>
    z.object({ passcode: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const key = clientKey();
    if (isThrottled(key)) return { ok: false as const, reason: "throttled" as const };

    const expected = process.env["ADMIN_PASSCODE"];
    if (!expected || !passcodeMatches(data.passcode, expected)) {
      recordFailedAttempt(key);
      return { ok: false as const, reason: "invalid" as const };
    }

    clearAttempts(key);
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

// Most recent bookings first; a restaurant never scrolls past a few hundred.
const RESERVATION_LIMIT = 500;

/**
 * The localisation migration adds `description_uz`, `address_ru` and friends.
 * Until it has been run those columns are absent, and a manager saving a dish
 * should not get an error for it — so every write below tries the full payload
 * and falls back to the base columns when the extra ones are unknown.
 *
 * Two different codes mean the same thing here: Postgres raises 42703
 * (undefined_column) for a query it parses itself, while PostgREST rejects a
 * write against its own schema cache with PGRST204 before Postgres ever sees it.
 */
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

function isMissingColumn(error: { code?: string } | null): boolean {
  return Boolean(error?.code && MISSING_COLUMN_CODES.has(error.code));
}

export const adminGetData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const [menu, reservations, settings] = await Promise.all([
    supabaseAdmin.from("menu_items").select("*").order("sort_order"),
    supabaseAdmin
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(RESERVATION_LIMIT),
    supabaseAdmin.from("site_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (menu.error) throw new Error(menu.error.message);
  if (reservations.error) throw new Error(reservations.error.message);
  if (settings.error) throw new Error(settings.error.message);

  // The settings singleton always exists, so it is the reliable place to ask
  // whether the localisation migration has run. The control room uses this to
  // decide whether to offer translation boxes at all.
  const localisationReady = Boolean(
    settings.data && "hero_title_uz" in (settings.data as Record<string, unknown>),
  );

  return {
    menu: (menu.data ?? []) as MenuItem[],
    reservations: (reservations.data ?? []) as Reservation[],
    settings: (settings.data as SiteSettings | null) ?? null,
    localisationReady,
    // Only whether it is wired up — never the token or the chat id.
    telegramReady: telegramConfigured(),
  };
});

const dishSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).default(""),
  // Blank is allowed: the site falls back to the base description.
  description_uz: z.string().trim().max(600).default(""),
  description_ru: z.string().trim().max(600).default(""),
  category: z.string().trim().min(1).max(60),
  price: z.number().min(0).max(100000000),
  image_url: z.union([z.string().trim().url().max(600), z.literal("")]).default(""),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const adminSaveDish = createServerFn({ method: "POST" })
  .validator((data: unknown) => dishSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, description_uz, description_ru, ...base } = data;

    const write = (fields: Record<string, unknown>) =>
      id
        ? supabaseAdmin
            .from("menu_items")
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq("id", id)
        : supabaseAdmin.from("menu_items").insert(fields as never);

    let { error } = await write({ ...base, description_uz, description_ru });
    if (isMissingColumn(error)) {
      ({ error } = await write(base));
    }
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteDish = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSetReservationStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("reservations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        hero_title: z.string().trim().min(1).max(120),
        hero_title_uz: z.string().trim().max(120).default(""),
        hero_title_ru: z.string().trim().max(120).default(""),
        phone: z.string().trim().min(1).max(40),
        address: z.string().trim().min(1).max(200),
        address_uz: z.string().trim().max(200).default(""),
        address_ru: z.string().trim().max(200).default(""),
        hours: z.string().trim().min(1).max(120),
        hours_uz: z.string().trim().max(120).default(""),
        hours_ru: z.string().trim().max(120).default(""),
        instagram: z
          .string()
          .trim()
          .min(1)
          .max(80)
          // Stored bare so the UI can render "@handle" and link to it directly.
          .transform((value) => value.replace(/^@+/, "")),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { hero_title_uz, hero_title_ru, address_uz, address_ru, hours_uz, hours_ru, ...base } =
      data;

    const write = (fields: Record<string, unknown>) =>
      supabaseAdmin
        .from("site_settings")
        .update({ ...fields, updated_at: new Date().toISOString() } as never)
        .eq("id", 1);

    let { error } = await write({
      ...base,
      hero_title_uz,
      hero_title_ru,
      address_uz,
      address_ru,
      hours_uz,
      hours_ru,
    });
    if (isMissingColumn(error)) {
      ({ error } = await write(base));
    }
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
