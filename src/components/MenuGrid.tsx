import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatSom } from "@/lib/format";
import { menuQuery } from "@/lib/queries";

export function MenuGrid({ limit }: { limit?: number }) {
  const { data: menu = [], isLoading } = useQuery(menuQuery);
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(menu.map((d) => d.category)))],
    [menu],
  );

  const items = useMemo(() => {
    const filtered = category === "All" ? menu : menu.filter((d) => d.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [menu, category, limit]);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`border px-5 py-2.5 text-[0.6rem] tracking-[0.26em] uppercase transition-all duration-500 ${
              category === cat
                ? "border-gold text-gold"
                : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="mt-16 text-center text-sm text-muted-foreground">Setting the table…</p>
      )}

      <motion.div layout className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((dish, i) => (
            <motion.article
              layout
              key={dish.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col border border-border bg-card transition-colors duration-500 hover:border-gold/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />
                <span className="absolute top-4 left-4 bg-background/80 px-3 py-1.5 text-[0.55rem] tracking-[0.26em] text-gold uppercase backdrop-blur">
                  {dish.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-2xl">{dish.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {dish.description}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <span className="font-display text-xl text-gradient-gold">
                    {formatSom(Number(dish.price))}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.success(`${dish.name} added to your order`)}
                    className="flex items-center gap-2 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:text-gold"
                  >
                    <Plus className="size-3.5" /> Add to order
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
