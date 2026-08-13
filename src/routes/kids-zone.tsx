import { createFileRoute, Link } from "@tanstack/react-router";
import { IceCream2, Palette, ShieldCheck, Pizza } from "lucide-react";

import { Reveal, SectionHeading } from "@/components/Reveal";

export const Route = createFileRoute("/kids-zone")({
  head: () => ({
    meta: [
      { title: "Kids Zone — Gracia Family Restaurant" },
      {
        name: "description",
        content:
          "A supervised play room, a little Italian menu and pizza-making for children at Gracia Family in Andijan.",
      },
      { property: "og:title", content: "Kids Zone — Gracia Family" },
      {
        property: "og:description",
        content: "A supervised room, a little menu, and dough for small hands.",
      },
    ],
  }),
  component: KidsZonePage,
});

const CARDS = [
  {
    icon: ShieldCheck,
    title: "Supervised play",
    body: "A soft-floor room in sight of the dining hall, watched by our staff every service.",
  },
  {
    icon: Pizza,
    title: "Make your own pizza",
    body: "Weekend afternoons: a ball of dough, a small apron, and the oven crew as teachers.",
  },
  {
    icon: Palette,
    title: "Drawing corner",
    body: "Paper, crayons and a wall where the best drawings stay up for the month.",
  },
  {
    icon: IceCream2,
    title: "Piccolo menu",
    body: "Half-portion pasta, plain margherita and gelato — priced for little appetites.",
  },
];

function KidsZonePage() {
  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="Kids Zone"
          title="A room of their own"
          intro="Italian dinners are long. We built a place where children can be children, so the grown-ups can order dessert."
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <div className="h-full border border-border bg-card p-8 transition-colors duration-500 hover:border-gold/40">
                <card.icon className="size-5 text-gold" />
                <h3 className="font-display mt-6 text-xl">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-20 grid items-center gap-12 border border-border bg-card p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
            <div>
              <p className="eyebrow">Family bookings</p>
              <h3 className="font-display mt-5 text-3xl leading-tight">
                Tell us how many children are coming
              </h3>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Add it to the special requests when you book and we'll set high chairs, reserve a
                table near the kids zone, and have the piccolo menu waiting.
              </p>
              <Link
                to="/reservations"
                className="mt-8 inline-block bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
              >
                Book a family table
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1595475207225-428b62bda831?auto=format&fit=crop&w=1200&q=80"
              alt="Children making pizza dough"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
