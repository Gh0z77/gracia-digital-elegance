import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { MenuItem, SiteSettings } from "./format";
import { cachedForAll } from "./server-cache";

// The carta and the contact details change a few times a week at most, so a
// generous stale window keeps navigation instant without serving stale prices.
const STALE_TIME = 5 * 60 * 1000;

/**
 * During SSR every request would otherwise repeat the same Supabase round trip
 * before a single byte reaches the browser. On the client there is nothing to
 * share between visitors, and react-query already holds the result.
 */
function onServer<T>(key: string, load: () => Promise<T>): Promise<T> {
  return typeof document === "undefined" ? cachedForAll(key, load) : load();
}

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  staleTime: STALE_TIME,
  queryFn: (): Promise<MenuItem[]> =>
    onServer("menu", async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as MenuItem[];
    }),
});

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  staleTime: STALE_TIME,
  queryFn: (): Promise<SiteSettings | null> =>
    onServer("site_settings", async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as SiteSettings) ?? null;
    }),
});

/** Fallbacks so the footer and contact page never render blank while loading. */
export const SETTINGS_FALLBACK: Omit<SiteSettings, "id"> = {
  hero_title: "Today's Special",
  phone: "+998 99 609 99 99",
  address: "Andijan, Uzbekistan",
  hours: "Mon–Sun · 10:00 — 23:00",
  instagram: "gracia_restaurant",
};
