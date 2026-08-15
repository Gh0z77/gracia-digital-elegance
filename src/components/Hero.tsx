import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatSom, type MenuItem } from "@/lib/format";
import { responsiveImage, sizedImage } from "@/lib/images";
import { localized, useI18n, type Dictionary, type Locale } from "@/lib/i18n";
import { menuQuery, settingsQuery } from "@/lib/queries";

const AUTOPLAY_MS = 7000;
const MAX_SLIDES = 5;
/** How long the outgoing slide stays mounted: its travel is the slower of its
 *  two animations at 0.55s, so unmount just after that rather than waiting for
 *  the incoming one to finish too. */
const SLIDE_MS = 580;

/**
 * The spotlight carousel.
 *
 * Both the copy and the plate are absolutely stacked inside fixed-height boxes.
 * That does two jobs at once: the buttons, thumbnails and counter below never
 * move when a longer dish name arrives, and the outgoing slide can stay mounted
 * long enough to travel away. Dishes ride a turntable: each one rises into
 * place from below while the one it replaces carries on up and over the top.
 * `prefers-reduced-motion` is handled in the stylesheet, and the autoplay clock
 * checks it too.
 */
export function Hero() {
  const { t, locale } = useI18n();
  const { data: menu = [] } = useQuery(menuQuery);
  const { data: settings } = useQuery(settingsQuery);

  const dishes = useMemo(() => {
    const featured = menu.filter((d) => d.featured);
    return (featured.length ? featured : menu).slice(0, MAX_SLIDES);
  }, [menu]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (next: number) => {
      if (!dishes.length) return;
      setIndex(((next % dishes.length) + dishes.length) % dishes.length);
    },
    [dishes.length],
  );

  // `index` is a dependency on purpose: touching a thumbnail restarts the clock
  // instead of letting the pending tick cut the new slide short.
  useEffect(() => {
    if (dishes.length < 2 || paused || reducedMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % dishes.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [dishes.length, index, paused, reducedMotion]);

  // A carousel spinning in a background tab is wasted work and wakes the GPU.
  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Warm every plate the carousel can reach, then decode it. Without this the
  // first pass animates each slide in around an image that is still
  // downloading, which reads as the carousel stalling rather than moving. The
  // delay keeps these off the critical path of the first plate.
  useEffect(() => {
    if (dishes.length < 2) return;
    const timer = setTimeout(() => {
      for (const dish of dishes) {
        const image = new Image();
        image.decoding = "async";
        image.srcset = `${sizedImage(dish.image_url, 640)} 1x, ${sizedImage(dish.image_url, 1024)} 2x`;
        image.src = sizedImage(dish.image_url, 640);
        // Decoding up front means the swap is a paint, not a decode.
        void image.decode().catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [dishes]);

  const active = dishes[index];

  // Holds the slide being replaced until its exit animation has finished.
  const [outgoing, setOutgoing] = useState<MenuItem | null>(null);
  const lastActive = useRef<MenuItem | undefined>(undefined);

  useEffect(() => {
    const previous = lastActive.current;
    lastActive.current = active;
    if (!previous || !active || previous.id === active.id) return;
    setOutgoing(previous);
    const timer = setTimeout(() => setOutgoing(null), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  const heroTitle = localized(settings, "hero_title", locale) || t.hero.eyebrow;

  return (
    <section
      className="grain relative min-h-screen overflow-hidden pt-32 pb-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="veil pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="hero-rings pointer-events-none absolute top-[12%] right-[-14%] size-[42rem] rounded-full border border-gold/15"
      >
        <div className="absolute inset-16 rounded-full border border-gold/10" />
        <div className="absolute inset-32 rounded-full border border-gold/5" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="eyebrow hero-eyebrow">{heroTitle}</p>

          {/* Fixed height: the tallest dish name and description must not push
              the buttons below them down the page. */}
          <div className="relative mt-6 min-h-[17rem] sm:min-h-[19rem] lg:min-h-[21rem]">
            {outgoing && (
              <div key={outgoing.id} className="slide-exit absolute inset-x-0 top-0" aria-hidden>
                <SlideCopy dish={outgoing} locale={locale} t={t} />
              </div>
            )}
            <div key={active?.id ?? "empty"} className="slide-enter absolute inset-x-0 top-0">
              <SlideCopy dish={active} locale={locale} t={t} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/reservations"
              className="bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
            >
              {t.common.reserve}
            </Link>
            <Link
              to="/menu"
              className="lux-underline text-[0.65rem] tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {t.common.exploreMenu}
            </Link>
          </div>

          {dishes.length > 1 && (
            <div
              className="mt-14 flex items-center gap-4"
              role="tablist"
              aria-label={t.hero.dishes}
            >
              {dishes.map((dish, i) => (
                <button
                  key={dish.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => go(i)}
                  aria-label={dish.name}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-full border transition-all duration-500 sm:size-[4.5rem] ${
                    i === index
                      ? "border-gold scale-110"
                      : "border-border opacity-55 hover:opacity-100"
                  }`}
                >
                  <img
                    {...responsiveImage(dish.image_url, 72)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={72}
                    height={72}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex min-h-[26rem] items-center justify-center lg:min-h-[38rem]">
          <div className="absolute size-[22rem] rounded-full bg-charcoal/80 blur-3xl sm:size-[30rem]" />

          <div className="relative size-[19rem] sm:size-[26rem] lg:size-[32rem]">
            {/* The wrapper carries the turntable travel; the endless float stays
                on the image itself, since both drive `transform` and cannot
                share a node. */}
            {outgoing && (
              <div key={outgoing.id} className="plate-exit absolute inset-0" aria-hidden>
                <Plate dish={outgoing} priority={false} />
              </div>
            )}
            {active && (
              <div key={active.id} className="plate-enter absolute inset-0">
                <Plate dish={active} priority />
              </div>
            )}
          </div>

          {dishes.length > 1 && (
            <div className="absolute bottom-0 flex items-center gap-6">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label={t.hero.previous}
                className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-500 hover:border-gold hover:text-gold"
              >
                <ArrowLeft className="size-4" />
              </button>
              <span className="numeric text-sm tracking-[0.3em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")} / {String(dishes.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label={t.hero.next}
                className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-500 hover:border-gold hover:text-gold"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The floating animation lives on the image itself while the slide transition
 * lives on its wrapper: both drive `transform`, so they cannot share a node.
 */
function Plate({ dish, priority }: { dish: MenuItem; priority: boolean }) {
  return (
    <img
      src={sizedImage(dish.image_url, 640)}
      srcSet={`${sizedImage(dish.image_url, 640)} 1x, ${sizedImage(dish.image_url, 1024)} 2x`}
      alt={dish.name}
      width={640}
      height={640}
      decoding="async"
      // The plate is the largest paint on the page — never defer the active one.
      fetchPriority={priority ? "high" : "low"}
      className="hero-plate-float plate-shadow size-full rounded-full object-cover"
    />
  );
}

function SlideCopy({
  dish,
  locale,
  t,
}: {
  dish: MenuItem | undefined;
  locale: Locale;
  t: Dictionary;
}) {
  return (
    <div aria-live="polite">
      {/* Clamped so an unusually long name can never grow the fixed box. */}
      <h1 className="font-display line-clamp-2 text-5xl leading-[1.02] text-balance sm:text-6xl lg:text-7xl">
        {dish?.name ?? t.hero.title}
      </h1>
      <p className="mt-7 line-clamp-3 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
        {dish ? localized(dish, "description", locale) : t.hero.description}
      </p>
      <div className="mt-8 flex items-center gap-5">
        <span className="numeric text-3xl text-gradient-gold">
          {dish ? formatSom(Number(dish.price)) : "—"}
        </span>
        <span className="h-px w-16 bg-gold/40" />
        <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
          {dish?.category ?? t.hero.category}
        </span>
      </div>
    </div>
  );
}
