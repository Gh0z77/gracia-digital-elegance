import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminSession, passcodeMatches, requireAdmin } from "./admin.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAdminSession();
  return { unlocked: Boolean(session.data.unlocked) };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) =>
    z.object({ passcode: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSCODE"];
    if (!expected) return { ok: false as const };
    if (!passcodeMatches(data.passcode, expected)) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminGetData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const [menu, reservations, settings] = await Promise.all([
    supabaseAdmin.from("menu_items").select("*").order("sort_order"),
    supabaseAdmin.from("reservations").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("site_settings").select("*").eq("id", 1).single(),
  ]);
  if (menu.error) throw new Error(menu.error.message);
  if (reservations.error) throw new Error(reservations.error.message);
  return {
    menu: menu.data ?? [],
    reservations: reservations.data ?? [],
    settings: settings.data ?? null,
  };
});

export const adminSaveDish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(600).default(""),
        category: z.string().trim().min(1).max(60),
        price: z.number().min(0).max(100000000),
        image_url: z.string().trim().max(600).default(""),
        available: z.boolean().default(true),
        featured: z.boolean().default(false),
        sort_order: z.number().int().min(0).max(9999).default(0),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...fields } = data;
    const query = id
      ? supabaseAdmin.from("menu_items").update(fields).eq("id", id)
      : supabaseAdmin.from("menu_items").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteDish = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminSetReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
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
  .inputValidator((data: unknown) =>
    z
      .object({
        hero_title: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(1).max(40),
        address: z.string().trim().min(1).max(200),
        hours: z.string().trim().min(1).max(120),
        instagram: z.string().trim().min(1).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
