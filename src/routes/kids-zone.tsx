import { createFileRoute, Link } from "@tanstack/react-router";
import { IceCream2, Palette, ShieldCheck, Pizza } from "lucide-react";

import { Reveal, SectionHeading } from "@/components/Reveal";
import { headDict, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/kids-zone")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.kidsTitle },
        { name: "description", content: t.meta.kidsDescription },
        { property: "og:title", content: t.meta.kidsTitle },
        { property: "og:description", content: t.meta.kidsDescription },
      ],
    };
  },
  component: KidsZonePage,
});

const CARD_ICONS = [ShieldCheck, Pizza, Palette, IceCream2] as const;

function KidsZonePage() {
  const { t } = useI18n();

  const cards = [
    { icon: CARD_ICONS[0], title: t.kids.c1Title, body: t.kids.c1Body },
    { icon: CARD_ICONS[1], title: t.kids.c2Title, body: t.kids.c2Body },
    { icon: CARD_ICONS[2], title: t.kids.c3Title, body: t.kids.c3Body },
    { icon: CARD_ICONS[3], title: t.kids.c4Title, body: t.kids.c4Body },
  ];

  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading eyebrow={t.kids.eyebrow} title={t.kids.title} intro={t.kids.intro} />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
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
              <p className="eyebrow">{t.kids.bookEyebrow}</p>
              <h3 className="font-display mt-5 text-3xl leading-tight">{t.kids.bookTitle}</h3>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {t.kids.bookBody}
              </p>
              <Link
                to="/reservations"
                className="mt-8 inline-block bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
              >
                {t.kids.bookCta}
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1595475207225-428b62bda831?auto=format&fit=crop&w=1200&q=80"
              alt={t.kids.imageAlt}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
