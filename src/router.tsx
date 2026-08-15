import { QueryClient, dehydrate, hydrate, type DehydratedState } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Page-shaped placeholder: the same rhythm as a real page, so nothing jumps. */
function PagePending() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-40 pb-28 lg:px-10" aria-hidden>
      <div className="animate-pulse space-y-6">
        <div className="mx-auto h-3 w-32 bg-muted" />
        <div className="mx-auto h-12 w-2/3 bg-muted" />
        <div className="mx-auto h-3 w-1/2 bg-muted" />
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Route loaders prime this cache on the server; without a stale window
        // the client would throw that work away and refetch on hydration.
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Hovering a link fetches its chunk and data, so the click itself lands on
    // an already-loaded page.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // If a navigation ever does outrun its data, show the shell rather than an
    // empty screen — but only after 300ms, so a fast hop doesn't flash a spinner.
    defaultPendingComponent: PagePending,
    defaultPendingMs: 300,
    defaultPendingMinMs: 250,
    // Ship the server's query cache down with the HTML so the menu and contact
    // details are already painted on first render instead of after a round trip.
    // Sent as a JSON string: react-query types the dehydrated payload with
    // `unknown` fields, which the router's serializability check rejects, and
    // every row we cache is plain JSON anyway.
    dehydrate: () => ({ queryState: JSON.stringify(dehydrate(queryClient)) }),
    hydrate: (dehydrated: { queryState: string }) =>
      hydrate(queryClient, JSON.parse(dehydrated.queryState) as DehydratedState),
  });

  return router;
};
