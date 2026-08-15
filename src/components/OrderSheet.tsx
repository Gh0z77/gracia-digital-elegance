import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatSom } from "@/lib/format";
import { responsiveImage } from "@/lib/images";
import { fmt, useI18n } from "@/lib/i18n";
import { useOrder } from "@/lib/order";

export function OrderSheet() {
  const { t } = useI18n();
  const { lines, count, total, setQuantity, remove, clear } = useOrder();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count ? fmt(t.order.itemCount, { count }) : t.order.emptyLabel}
        className="relative p-2 text-muted-foreground transition-colors hover:text-gold"
      >
        <ShoppingBag className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-gold text-[0.55rem] font-medium text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col border-border bg-card sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-2xl font-normal">{t.order.title}</SheetTitle>
            <SheetDescription className="text-sm">{t.order.description}</SheetDescription>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.order.empty}</p>
              <Link
                to="/menu"
                onClick={() => setOpen(false)}
                className="border border-gold/50 px-6 py-3 text-[0.6rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
              >
                {t.order.openMenu}
              </Link>
            </div>
          ) : (
            <>
              <ul className="-mx-6 flex-1 divide-y divide-border overflow-y-auto px-6">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-4 py-5">
                    <img
                      {...responsiveImage(line.image_url, 64)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      className="size-16 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-lg">{line.name}</p>
                      <p className="numeric mt-1 text-sm text-gold">{formatSom(line.price)}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={fmt(t.order.fewer, { dish: line.name })}
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          className="flex size-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={fmt(t.order.more, { dish: line.name })}
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          className="flex size-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={fmt(t.order.remove, { dish: line.name })}
                          onClick={() => remove(line.id)}
                          className="ml-auto p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-6">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow">{t.order.total}</span>
                  <span className="numeric text-2xl text-gradient-gold">{formatSom(total)}</span>
                </div>
                <Link
                  to="/reservations"
                  onClick={() => setOpen(false)}
                  className="mt-6 block bg-gold px-6 py-4 text-center text-[0.6rem] tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
                >
                  {t.order.book}
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="lux-underline mt-5 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase hover:text-destructive"
                >
                  {t.order.clear}
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
