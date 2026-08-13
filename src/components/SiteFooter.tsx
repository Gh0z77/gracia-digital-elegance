import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";

import { settingsQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);
  const phone = settings?.phone ?? "+998 99 609 99 99";
  const address = settings?.address ?? "Andijan, Uzbekistan";
  const hours = settings?.hours ?? "Mon–Sun · 10:00 — 23:00";
  const instagram = settings?.instagram ?? "gracia_restaurant";

  return (
    <footer className="border-t border-border bg-slate-deep">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr_1fr_1.2fr] lg:px-10">
        <div>
          <div className="font-display text-3xl tracking-[0.3em] text-gradient-gold">GRACIA</div>
          <p className="mt-1 text-[0.6rem] tracking-[0.35em] text-muted-foreground uppercase">
            Family · Since 1998
          </p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            An Italian table in the heart of Andijan. Slow food, warm hands, and a room built for
            families.
          </p>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">Location</p>
          <p className="flex items-start gap-3 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
            {address}
          </p>
          <p className="flex items-start gap-3 text-sm text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
            {hours}
          </p>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">Contact</p>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <Phone className="size-4 shrink-0 text-gold" />
            {phone}
          </a>
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <Instagram className="size-4 shrink-0 text-gold" />@{instagram}
          </a>
          <Link
            to="/reservations"
            className="inline-block border border-gold/50 px-5 py-2.5 text-[0.6rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
          >
            Reserve a table
          </Link>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">Find us</p>
          <div className="overflow-hidden border border-border">
            <iframe
              title="Gracia Family location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=72.29%2C40.75%2C72.39%2C40.80&layer=mapnik&marker=40.7821%2C72.3442"
              className="h-48 w-full opacity-80 grayscale transition-all duration-700 hover:opacity-100"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-6 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>© {new Date().getFullYear()} Gracia Family Restaurant</span>
          <Link to="/admin" className="transition-colors hover:text-gold">
            Manager access
          </Link>
        </div>
      </div>
    </footer>
  );
}
