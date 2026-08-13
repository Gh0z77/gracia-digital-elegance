import { createFileRoute } from "@tanstack/react-router";

import { Reveal, SectionHeading } from "@/components/Reveal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Gracia Family Restaurant" },
      {
        name: "description",
        content:
          "The story behind Gracia Family: an Italian kitchen in Andijan built around one family's recipe book and a room made for long dinners.",
      },
      { property: "og:title", content: "About Gracia Family" },
      {
        property: "og:description",
        content: "One family, one recipe book, and an Italian dining room in Andijan.",
      },
    ],
  }),
  component: AboutPage,
});

const CHAPTERS = [
  {
    year: "1998",
    title: "A recipe book crosses a border",
    body: "Nonna Gracia's handwritten book of Emilian recipes arrives in Andijan in a suitcase, wrapped in linen.",
  },
  {
    year: "2011",
    title: "The first dining room",
    body: "Twelve tables, one oven, and a rule the family still keeps: nothing leaves the pass that we wouldn't serve at home.",
  },
  {
    year: "2019",
    title: "The kids zone",
    body: "A separate, supervised room so parents can finish a second course while the children build their own pizza.",
  },
  {
    year: "Today",
    title: "Sixty seats, one table",
    body: "A candle-lit monochrome room, a wood-fired oven at 480°C, and pasta rolled before every service.",
  },
];

function AboutPage() {
  return (
    <>
      <section className="pt-40 pb-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <SectionHeading
            eyebrow="About Us"
            title="Cooked slowly, served warmly"
            intro="Gracia Family is not a concept. It is a family, a recipe book, and a room in Andijan where Italian dinners run long."
          />
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
              alt="Guests dining at Gracia Family"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
            />
          </Reveal>
          <div className="space-y-10">
            {CHAPTERS.map((chapter, i) => (
              <Reveal key={chapter.year} delay={i * 0.08}>
                <div className="border-l border-border pl-8 transition-colors duration-500 hover:border-gold">
                  <span className="eyebrow">{chapter.year}</span>
                  <h3 className="font-display mt-4 text-2xl">{chapter.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {chapter.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
