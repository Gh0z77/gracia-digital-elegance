import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ReservationForm } from "@/components/ReservationForm";
import { Reveal, SectionHeading } from "@/components/Reveal";
import { telHref } from "@/lib/format";
import { headDict, useI18n } from "@/lib/i18n";
import { settingsQuery, SETTINGS_FALLBACK } from "@/lib/queries";

export const Route = createFileRoute("/reservations")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.reservationsTitle },
        { name: "description", content: t.meta.reservationsDescription },
        { property: "og:title", content: t.meta.reservationsTitle },
        { property: "og:description", content: t.meta.reservationsDescription },
      ],
    };
  },
  component: ReservationsPage,
});

function ReservationsPage() {
  const { t } = useI18n();
  const { data: settings } = useQuery(settingsQuery);
  const phone = settings?.phone ?? SETTINGS_FALLBACK.phone;

  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto grid max-w-[1200px] gap-16 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
        <div>
          <SectionHeading
            align="left"
            eyebrow={t.reservations.eyebrow}
            title={t.reservations.title}
            intro={t.reservations.intro}
          />
          <Reveal delay={0.1}>
            <div className="hairline mt-12" />
            <dl className="mt-10 space-y-6 text-sm">
              <div>
                <dt className="eyebrow">{t.reservations.lunch}</dt>
                <dd className="mt-2 text-muted-foreground">12:00 — 15:00</dd>
              </div>
              <div>
                <dt className="eyebrow">{t.reservations.dinner}</dt>
                <dd className="mt-2 text-muted-foreground">17:00 — 23:00</dd>
              </div>
              <div>
                <dt className="eyebrow">{t.reservations.byPhone}</dt>
                <dd className="mt-2">
                  <a
                    href={telHref(phone)}
                    className="text-muted-foreground transition-colors hover:text-gold"
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <ReservationForm />
        </Reveal>
      </div>
    </section>
  );
}
