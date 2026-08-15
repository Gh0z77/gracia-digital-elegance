import type { QueryClient } from "@tanstack/react-query";

import { menuQuery, settingsQuery } from "./queries";

/**
 * Warms the query cache during SSR so the menu and contact details ship inside
 * the HTML — crawlers and slow connections see the carta immediately.
 *
 * Failures are deliberately swallowed: a Supabase hiccup should degrade the
 * page to a client-side fetch with its own retry, not blank the whole route.
 */
export async function prefetchSiteData(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery(menuQuery),
    queryClient.prefetchQuery(settingsQuery),
  ]);
}
