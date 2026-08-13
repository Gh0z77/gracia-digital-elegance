import { createFileRoute } from "@tanstack/react-router";

import { MenuGrid } from "@/components/MenuGrid";
import { SectionHeading } from "@/components/Reveal";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Gracia Family Italian Restaurant" },
      {
        name: "description",
        content:
          "Starters, hand-rolled pasta, wood-fired pizza, main courses, dolci and drinks at Gracia Family in Andijan.",
      },
      { property: "og:title", content: "Menu — Gracia Family" },
      {
        property: "og:description",
        content: "Explore the full Italian carta: antipasti, pasta, pizza, secondi and dolci.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading
          eyebrow="La Carta"
          title="The full menu"
          intro="Filter by course. Everything is cooked to order, so the kitchen asks for a little patience."
        />
        <div className="mt-16">
          <MenuGrid />
        </div>
      </div>
    </section>
  );
}
