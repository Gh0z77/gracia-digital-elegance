import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";

import { Reveal, SectionHeading } from "@/components/Reveal";
import { telHref } from "@/lib/format";
import { headDict, localized, useI18n } from "@/lib/i18n";
import { settingsQuery, SETTINGS_FALLBACK } from "@/lib/queries";

const MAP_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=72.29%2C40.75%2C72.39%2C40.80&layer=mapnik&marker=40.7821%2C72.3442";

export const Route = createFileRoute("/contact")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.contactTitle },
        { name: "description", content: t.meta.contactDescription },
        { property: "og:title", content: t.meta.contactTitle },
        { property: "og:description", content: t.meta.contactDescription },
      ],
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { t, locale } = useI18n();
  const { data: settings } = useQuery(settingsQuery);
  const { phone, instagram } = { ...SETTINGS_FALLBACK, ...(settings ?? {}) };
  const address = localized(settings, "address", locale) || SETTINGS_FALLBACK.address;
  const hours = localized(settings, "hours", locale) || SETTINGS_FALLBACK.hours;

  const rows = [
    { icon: MapPin, label: t.contact.location, value: address },
    { icon: Clock, label: t.contact.hours, value: hours },
    { icon: Phone, label: t.contact.telephone, value: phone, href: telHref(phone) },
    {
      icon: Instagram,
      label: t.contact.instagram,
      value: `@${instagram}`,
      href: `https://instagram.com/${instagram}`,
    },
  ];

  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          eyebrow={t.contact.eyebrow}
          title={t.contact.title}
          intro={t.contact.intro}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            {rows.map((row, i) => (
              <Reveal key={row.label} delay={i * 0.07}>
                <div className="flex items-start gap-5 border-b border-border pb-8">
                  <row.icon className="mt-1 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="eyebrow">{row.label}</p>
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="font-display mt-2 block text-2xl transition-colors hover:text-gold"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <p className="font-display mt-2 text-2xl">{row.value}</p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="h-full min-h-[26rem] overflow-hidden border border-border">
              <iframe
                title={t.contact.mapTitle}
                src={MAP_EMBED}
                className="size-full min-h-[26rem] opacity-85 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
