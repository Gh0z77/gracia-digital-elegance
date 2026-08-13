import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";

import { Reveal, SectionHeading } from "@/components/Reveal";
import { settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Gracia Family Restaurant, Andijan" },
      {
        name: "description",
        content:
          "Find Gracia Family in Andijan, Uzbekistan. Call +998 99 609 99 99, see opening hours and follow @gracia_restaurant.",
      },
      { property: "og:title", content: "Contact Gracia Family" },
      {
        property: "og:description",
        content: "Address, hours and phone for Gracia Family Italian restaurant in Andijan.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useQuery(settingsQuery);
  const phone = settings?.phone ?? "+998 99 609 99 99";
  const address = settings?.address ?? "Andijan, Uzbekistan";
  const hours = settings?.hours ?? "Mon–Sun · 10:00 — 23:00";
  const instagram = settings?.instagram ?? "gracia_restaurant";

  const rows = [
    { icon: MapPin, label: "Location", value: address },
    { icon: Clock, label: "Hours", value: hours },
    { icon: Phone, label: "Telephone", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    {
      icon: Instagram,
      label: "Instagram",
      value: `@${instagram}`,
      href: `https://instagram.com/${instagram}`,
    },
  ];

  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="Contact"
          title="Come and find us"
          intro="We're in the centre of Andijan. Call ahead on busy evenings — the room fills quickly."
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
                title="Map to Gracia Family in Andijan"
                src="https://www.openstreetmap.org/export/embed.html?bbox=72.29%2C40.75%2C72.39%2C40.80&layer=mapnik&marker=40.7821%2C72.3442"
                className="size-full min-h-[26rem] opacity-85 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
