import { createFileRoute } from "@tanstack/react-router";

import { Reveal, SectionHeading } from "@/components/Reveal";
import { headDict, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.aboutTitle },
        { name: "description", content: t.meta.aboutDescription },
        { property: "og:title", content: t.meta.aboutTitle },
        { property: "og:description", content: t.meta.aboutDescription },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  const chapters = [
    { year: t.about.y1Year, title: t.about.y1Title, body: t.about.y1Body },
    { year: t.about.y2Year, title: t.about.y2Title, body: t.about.y2Body },
    { year: t.about.y3Year, title: t.about.y3Title, body: t.about.y3Body },
    { year: t.about.y4Year, title: t.about.y4Title, body: t.about.y4Body },
  ];

  return (
    <>
      <section className="pt-40 pb-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} intro={t.about.intro} />
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
              alt={t.about.imageAlt}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
            />
          </Reveal>
          <div className="space-y-10">
            {chapters.map((chapter, i) => (
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
