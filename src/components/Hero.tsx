import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { formatSom } from "@/lib/format";
import { menuQuery, settingsQuery } from "@/lib/queries";

export function Hero() {
  const { data: menu = [] } = useQuery(menuQuery);
  const { data: settings } = useQuery(settingsQuery);
  const dishes = (menu.filter((d) => d.featured).length ? menu.filter((d) => d.featured) : menu).slice(
    0,
    5,
  );
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const go = useCallback(
    (next: number) => {
      if (!dishes.length) return;
      setDir(next > index ? 1 : -1);
      setIndex(((next % dishes.length) + dishes.length) % dishes.length);
    },
    [dishes.length, index],
  );

  useEffect(() => {
    if (dishes.length < 2) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % dishes.length);
    }, 7000);
    return () => clearInterval(t);
  }, [dishes.length]);

  const active = dishes[index];

  return (
    <section className="grain relative min-h-screen overflow-hidden pt-28 pb-16">
      <div className="veil pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[12%] right-[-14%] size-[42rem] rounded-full border border-gold/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-16 rounded-full border border-gold/10" />
        <div className="absolute inset-32 rounded-full border border-gold/5" />
      </motion.div>

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {settings?.hero_title ?? "Today's Special"}
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? "empty"}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display mt-6 text-5xl leading-[1.02] text-balance sm:text-6xl lg:text-7xl">
                {active?.name ?? "Gracia Family"}
              </h1>
              <p className="mt-7 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
                {active?.description ??
                  "An Italian family table in Andijan — slow food, warm light, and recipes carried across generations."}
              </p>
              <div className="mt-8 flex items-center gap-5">
                <span className="font-display text-3xl text-gradient-gold">
                  {active ? formatSom(Number(active.price)) : "—"}
                </span>
                <span className="h-px w-16 bg-gold/40" />
                <span className="text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
                  {active?.category ?? "Cucina"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/reservations"
              className="bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
            >
              Reserve a table
            </Link>
            <Link
              to="/menu"
              className="lux-underline text-[0.65rem] tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Explore the menu
            </Link>
          </div>

          <div className="mt-14 flex items-center gap-4">
            {dishes.map((dish, i) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => go(i)}
                aria-label={dish.name}
                className={`relative size-16 shrink-0 overflow-hidden rounded-full border transition-all duration-500 sm:size-[4.5rem] ${
                  i === index
                    ? "border-gold scale-110"
                    : "border-border opacity-55 hover:opacity-100"
                }`}
              >
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[26rem] items-center justify-center lg:min-h-[38rem]">
          <div className="absolute size-[22rem] rounded-full bg-charcoal/80 blur-3xl sm:size-[30rem]" />
          <AnimatePresence mode="popLayout" custom={dir}>
            {active && (
              <motion.img
                key={active.id}
                src={active.image_url}
                alt={active.name}
                custom={dir}
                initial={{ opacity: 0, scale: 0.82, rotate: dir * -22 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -14, 0] }}
                exit={{ opacity: 0, scale: 0.86, rotate: dir * 18 }}
                transition={{
                  opacity: { duration: 0.6 },
                  scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  rotate: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                }}
                className="plate-shadow relative size-[19rem] rounded-full object-cover sm:size-[26rem] lg:size-[32rem]"
              />
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 flex items-center gap-6">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous dish"
              className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-500 hover:border-gold hover:text-gold"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="font-display text-sm tracking-[0.3em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(dishes.length || 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next dish"
              className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-500 hover:border-gold hover:text-gold"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
