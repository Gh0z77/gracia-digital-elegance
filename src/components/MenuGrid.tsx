import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { DishDialog } from "@/components/DishDialog";
import { formatSom, type MenuItem } from "@/lib/format";
import { responsiveImage } from "@/lib/images";
import { fmt, localized, useI18n, type Dictionary } from "@/lib/i18n";
import { useOrder } from "@/lib/order";
import { menuQuery } from "@/lib/queries";

const ALL = "All";

/** Course names live in the database in English; the dictionary maps them. */
function categoryLabel(t: Dictionary, category: string): string {
  if (category === ALL) return t.categories.all;
  const labels = t.categories as Record<string, string>;
  return labels[category] ?? category;
}

export function MenuGrid({ limit }: { limit?: number }) {
  const { t, locale } = useI18n();
  const { data: menu = [], isLoading, isError, refetch } = useQuery(menuQuery);
  const { add } = useOrder();
  const [category, setCategory] = useState(ALL);
  const [detail, setDetail] = useState<MenuItem | null>(null);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(menu.map((d) => d.category)))],
    [menu],
  );

  const items = useMemo(() => {
    const filtered = category === ALL ? menu : menu.filter((d) => d.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [menu, category, limit]);

  if (isError) {
    return (
      <div className="border border-border bg-card px-8 py-16 text-center">
        <h3 className="font-display text-2xl">{t.menu.errorTitle}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{t.menu.errorBody}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-8 border border-gold/50 px-7 py-3.5 text-[0.6rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
        >
          {t.common.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* One button per course; hidden while loading so the row doesn't pop in empty. */}
      {!isLoading && categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`border px-5 py-2.5 text-[0.6rem] tracking-[0.26em] uppercase transition-all duration-500 ${
                category === cat
                  ? "border-gold text-gold"
                  : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {categoryLabel(t, cat)}
            </button>
          ))}
        </div>
      )}

      {isLoading && <MenuSkeleton count={limit ?? 6} />}

      {!isLoading && items.length === 0 && (
        <p className="mt-16 text-center text-sm text-muted-foreground">{t.menu.empty}</p>
      )}

      {/* Keyed by category so the whole grid remounts on a filter change and the
          cards replay their CSS entrance, staggered by column. */}
      <div key={category} className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((dish, i) => (
          <article
            key={dish.id}
            className="card-enter group flex flex-col border border-border bg-card transition-colors duration-500 hover:border-gold/40"
            style={{ "--card-delay": `${(i % 3) * 0.06}s` } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => setDetail(dish)}
              aria-label={fmt(t.menu.viewDetails, { dish: dish.name })}
              className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden"
            >
              <img
                {...responsiveImage(dish.image_url, 460)}
                alt={dish.name}
                loading="lazy"
                decoding="async"
                width={460}
                height={345}
                className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <span className="absolute top-4 left-4 bg-background/80 px-3 py-1.5 text-[0.55rem] tracking-[0.26em] text-gold uppercase backdrop-blur">
                {categoryLabel(t, dish.category)}
              </span>
            </button>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="font-display text-2xl">{dish.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {localized(dish, "description", locale)}
              </p>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
                <span className="numeric text-xl text-gradient-gold">
                  {formatSom(Number(dish.price))}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setDetail(dish)}
                    className="lux-underline text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                  >
                    {t.menu.details}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      add(dish);
                      toast.success(fmt(t.menu.added, { dish: dish.name }));
                    }}
                    className="flex items-center gap-2 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:text-gold"
                  >
                    <Plus className="size-3.5" /> {t.menu.add}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <DishDialog dish={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  );
}

function MenuSkeleton({ count }: { count: number }) {
  return (
    <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse border border-border bg-card">
          <div className="aspect-[4/3] w-full bg-muted" />
          <div className="space-y-4 p-7">
            <div className="h-6 w-2/3 bg-muted" />
            <div className="h-3 w-full bg-muted" />
            <div className="h-3 w-4/5 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
