import { createFileRoute } from "@tanstack/react-router";

import { ReservationForm } from "@/components/ReservationForm";
import { Reveal, SectionHeading } from "@/components/Reveal";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "Book a Table — Gracia Family Andijan" },
      {
        name: "description",
        content:
          "Reserve a table at Gracia Family in Andijan. Choose your date, time and party size — we confirm every booking by phone.",
      },
      { property: "og:title", content: "Book a Table — Gracia Family" },
      {
        property: "og:description",
        content: "Reserve your evening at Gracia Family Italian restaurant in Andijan.",
      },
    ],
  }),
  component: ReservationsPage,
});

function ReservationsPage() {
  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto grid max-w-[1200px] gap-16 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Table Reservation"
            title="Reserve your evening"
            intro="A table at Gracia is held for fifteen minutes past your time. For parties above eight, call us and we'll arrange the long table."
          />
          <Reveal delay={0.1}>
            <div className="hairline mt-12" />
            <dl className="mt-10 space-y-6 text-sm">
              <div>
                <dt className="eyebrow">Lunch</dt>
                <dd className="mt-2 text-muted-foreground">12:00 — 15:00</dd>
              </div>
              <div>
                <dt className="eyebrow">Dinner</dt>
                <dd className="mt-2 text-muted-foreground">17:00 — 23:00</dd>
              </div>
              <div>
                <dt className="eyebrow">By phone</dt>
                <dd className="mt-2 text-muted-foreground">+998 99 609 99 99</dd>
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
