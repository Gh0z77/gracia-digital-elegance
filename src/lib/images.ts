/**
 * Dish photos are stored as full Unsplash URLs, which default to far more pixels
 * than any slot on the page actually uses — a 1000px file behind a 380px card is
 * roughly seven times the bytes needed. Unsplash resizes on its CDN through
 * query parameters, so rewrite the width per slot and hand the browser a srcset
 * to pick from.
 *
 * Anything that isn't an Unsplash URL is returned untouched, so a manager can
 * still paste a link to their own photo.
 */
const UNSPLASH_HOST = "images.unsplash.com";

const DEFAULT_DPR_STEPS = [1, 2];

function isUnsplash(url: string): boolean {
  return url.startsWith(`https://${UNSPLASH_HOST}/`);
}

/** Same photo, resized on the CDN to the width the layout actually needs. */
export function sizedImage(url: string, width: number): string {
  if (!url || !isUnsplash(url)) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "75");
    return parsed.toString();
  } catch {
    return url;
  }
}

/** `srcset` at 1x and 2x so retina screens stay sharp without doubling everyone's bytes. */
export function imageSrcSet(
  url: string,
  width: number,
  steps = DEFAULT_DPR_STEPS,
): string | undefined {
  if (!url || !isUnsplash(url)) return undefined;
  return steps.map((dpr) => `${sizedImage(url, Math.round(width * dpr))} ${dpr}x`).join(", ");
}

/**
 * Everything an <img> needs for one layout slot.
 *
 * ```tsx
 * <img {...responsiveImage(dish.image_url, 420)} alt={dish.name} loading="lazy" />
 * ```
 */
export function responsiveImage(url: string, width: number) {
  const srcSet = imageSrcSet(url, width);
  return { src: sizedImage(url, width), ...(srcSet ? { srcSet } : {}) };
}
