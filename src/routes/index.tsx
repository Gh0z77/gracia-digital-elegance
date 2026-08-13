import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, Flame, HeartHandshake, UtensilsCrossed } from "lucide-react";

import { Hero } from "@/components/Hero";
import { MenuGrid } from "@/components/MenuGrid";
import { ReservationForm } from "@/components/ReservationForm";
import { Reveal, SectionHeading } from "@/components/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gracia Family — Italian Family Restaurant in Andijan" },
      {
        name: "description",
        content:
          "Hand-made pasta, wood-fired pizza and a dedicated kids zone. Reserve your table at Gracia Family in Andijan, Uzbekistan.",
      },
      { property: "og:title", content: "Gracia Family — Italian Family Restaurant" },
      {
        property: "og:description",
        content: "Slow Italian cooking, a warm family room and a kids zone in Andijan.",
      },
    ],
  }),
  component: Home,
});

const PILLARS = [
  {
    icon: UtensilsCrossed,
    title: "Cucina Autentica",
    body: "Recipes carried from Emilia-Romagna, pasta rolled every morning before service.",
  },
  {
    icon: Flame,
    title: "Wood-fired Oven",
    body: "A 480°C stone oven and 48-hour dough — the crust our regulars come back for.",
  },
  {
    icon: HeartHandshake,
    title: "Family Table",
    body: "Long tables, shared plates, and a room that stays loud in the best way.",
  },
  {
    icon: Baby,
    title: "Kids Zone",
    body: "A supervised play corner with its own little menu, so parents can finish dinner.",
  },
];

function Home() {
  return (
    <>
      <Hero />

      <section className="border-t border-border py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <Reveal>
              <div className="relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80"
                  alt="The dining room at Gracia Family"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
                />
              </div>
            </Reveal>
            <div>
              <SectionHeading
                align="left"
                eyebrow="About & Atmosphere"
                title="An Italian house where children are welcome and dinner takes its time"
                intro="Gracia Family began as a single family recipe book. Today it is a candle-lit room in Andijan where nonna's ragù simmers for nine hours, the bread is torn not sliced, and the youngest guests have a room of their own."
              />
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {PILLARS.map((pillar, i) => (
                  <Reveal key={pillar.title} delay={i * 0.08}>
                    <div className="border border-border bg-card p-7 transition-colors duration-500 hover:border-gold/40">
                      <pillar.icon className="size-5 text-gold" />
                      <h3 className="font-display mt-5 text-xl">{pillar.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {pillar.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-slate-deep py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <SectionHeading
            eyebrow="The Menu"
            title="Selected from the carta"
            intro="A short look at the kitchen. The full menu changes with the market and the season."
          />
          <div className="mt-16">
            <MenuGrid limit={6} />
          </div>
          <div className="mt-16 text-center">
            <Link
              to="/menu"
              className="inline-block border border-gold/50 px-8 py-4 text-[0.65rem] tracking-[0.3em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
            >
              View the full menu
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-28">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Reservations"
              title="Book your table"
              intro="Tell us when you're coming and how many chairs to set. We confirm every booking by phone."
            />
            <Reveal delay={0.1}>
              <div className="hairline mt-12" />
              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                Large parties and celebrations are our favourite kind of evening — mention it in the
                special requests and we'll dress the table.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <ReservationForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
