import { Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatSom, type MenuItem } from "@/lib/format";
import { responsiveImage } from "@/lib/images";
import { localized, useI18n } from "@/lib/i18n";
import { useOrder } from "@/lib/order";

export function DishDialog({
  dish,
  onOpenChange,
}: {
  dish: MenuItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const { add } = useOrder();

  return (
    <Dialog open={Boolean(dish)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 border-border bg-card p-0 sm:rounded-none">
        {dish && (
          <div className="grid sm:grid-cols-2">
            <img
              {...responsiveImage(dish.image_url, 520)}
              alt={dish.name}
              width={520}
              height={520}
              decoding="async"
              className="aspect-square w-full object-cover"
            />
            <div className="flex flex-col p-8 sm:p-10">
              <p className="eyebrow">{dish.category}</p>
              <DialogTitle className="font-display mt-4 text-3xl leading-tight font-normal tracking-normal">
                {dish.name}
              </DialogTitle>
              <DialogDescription className="mt-5 text-sm leading-relaxed">
                {localized(dish, "description", locale)}
              </DialogDescription>
              <div className="mt-auto pt-8">
                <span className="numeric text-3xl text-gradient-gold">
                  {formatSom(Number(dish.price))}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    add(dish);
                    onOpenChange(false);
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-2 bg-gold px-6 py-3.5 text-[0.6rem] tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
                >
                  <Plus className="size-3.5" /> {t.menu.addToOrder}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
