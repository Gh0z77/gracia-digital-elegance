import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, Flame, HeartHandshake, UtensilsCrossed } from "lucide-react";

import { Hero } from "@/components/Hero";
import { MenuGrid } from "@/components/MenuGrid";
import { ReservationForm } from "@/components/ReservationForm";
import { Reveal, SectionHeading } from "@/components/Reveal";
import { headDict, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.homeTitle },
        { name: "description", content: t.meta.homeDescription },
        { property: "og:title", content: t.meta.homeTitle },
        { property: "og:description", content: t.meta.homeDescription },
      ],
    };
  },
  component: Home,
});

const PILLAR_ICONS = [UtensilsCrossed, Flame, HeartHandshake, Baby] as const;

function Home() {
  const { t } = useI18n();

  const pillars = [
    { icon: PILLAR_ICONS[0], title: t.home.pillar1Title, body: t.home.pillar1Body },
    { icon: PILLAR_ICONS[1], title: t.home.pillar2Title, body: t.home.pillar2Body },
    { icon: PILLAR_ICONS[2], title: t.home.pillar3Title, body: t.home.pillar3Body },
    { icon: PILLAR_ICONS[3], title: t.home.pillar4Title, body: t.home.pillar4Body },
  ];

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
                  alt={t.about.imageAlt}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1400ms] hover:grayscale-0"
                />
              </div>
            </Reveal>
            <div>
              <SectionHeading
                align="left"
                eyebrow={t.home.aboutEyebrow}
                title={t.home.aboutTitle}
                intro={t.home.aboutIntro}
              />
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {pillars.map((pillar, i) => (
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
            eyebrow={t.home.menuEyebrow}
            title={t.home.menuTitle}
            intro={t.home.menuIntro}
          />
          <div className="mt-16">
            <MenuGrid limit={6} />
          </div>
          <div className="mt-16 text-center">
            <Link
              to="/menu"
              className="inline-block border border-gold/50 px-8 py-4 text-[0.65rem] tracking-[0.3em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
            >
              {t.common.viewFullMenu}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-28">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <SectionHeading
              align="left"
              eyebrow={t.home.reservationsEyebrow}
              title={t.home.reservationsTitle}
              intro={t.home.reservationsIntro}
            />
            <Reveal delay={0.1}>
              <div className="hairline mt-12" />
              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                {t.home.reservationsNote}
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
