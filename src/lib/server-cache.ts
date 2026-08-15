/**
 * A tiny in-process cache for the two public tables.
 *
 * Every server-rendered page waits on the menu and the site settings, and the
 * Supabase project sits in ap-southeast-1 — a round trip that dominates TTFB
 * from Central Asia. The carta changes a few times a week, so serving it from
 * memory for a minute costs nothing in freshness and removes the round trip
 * from almost every request.
 *
 * Best-effort by design: on a serverless host the isolate may be recycled at
 * any time, which simply means the next request repopulates it. Entries are
 * shared across requests on purpose, so this must only ever hold data that is
 * identical for every visitor — never anything derived from a session.
 */
const TTL_MS = 60_000;

type Entry = { value: unknown; at: number; inflight?: Promise<unknown> };

const store = new Map<string, Entry>();

export async function cachedForAll<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now - hit.at < TTL_MS) return hit.value as T;

  // Collapse concurrent misses onto one request rather than stampeding Supabase
  // when several pages are rendered at once.
  if (hit?.inflight) return hit.inflight as Promise<T>;

  const inflight = load()
    .then((value) => {
      store.set(key, { value, at: Date.now() });
      return value;
    })
    .catch((error) => {
      store.delete(key);
      // Serving slightly stale data beats failing the render outright.
      if (hit) return hit.value as T;
      throw error;
    });

  store.set(key, { value: hit?.value, at: hit?.at ?? 0, inflight });
  return inflight as Promise<T>;
}
