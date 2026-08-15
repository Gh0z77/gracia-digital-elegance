import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";

import { telHref } from "@/lib/format";
import { fmt, localized, useI18n } from "@/lib/i18n";
import { settingsQuery, SETTINGS_FALLBACK } from "@/lib/queries";

const MAP_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=72.29%2C40.75%2C72.39%2C40.80&layer=mapnik&marker=40.7821%2C72.3442";

export function SiteFooter() {
  const { t, locale } = useI18n();
  const { data: settings } = useQuery(settingsQuery);
  const { phone, instagram } = { ...SETTINGS_FALLBACK, ...(settings ?? {}) };
  const address = localized(settings, "address", locale) || SETTINGS_FALLBACK.address;
  const hours = localized(settings, "hours", locale) || SETTINGS_FALLBACK.hours;

  return (
    <footer className="border-t border-border bg-slate-deep">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr_1fr_1.2fr] lg:px-10">
        <div>
          <div className="font-display text-3xl tracking-[0.3em] text-gradient-gold">GRACIA</div>
          <p className="mt-1 text-[0.6rem] tracking-[0.35em] text-muted-foreground uppercase">
            {t.footer.since}
          </p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t.footer.tagline}
          </p>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">{t.footer.location}</p>
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
          <p className="eyebrow">{t.footer.contact}</p>
          <a
            href={telHref(phone)}
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
            {t.common.reserve}
          </Link>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">{t.footer.findUs}</p>
          <div className="overflow-hidden border border-border">
            <iframe
              title={t.footer.mapTitle}
              src={MAP_EMBED}
              className="h-48 w-full opacity-80 grayscale transition-all duration-700 hover:opacity-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-6 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>{fmt(t.footer.rights, { year: new Date().getFullYear() })}</span>
          <Link to="/admin" className="transition-colors hover:text-gold">
            {t.footer.manager}
          </Link>
        </div>
      </div>
    </footer>
  );
}
