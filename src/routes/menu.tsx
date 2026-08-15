import { createFileRoute } from "@tanstack/react-router";

import { MenuGrid } from "@/components/MenuGrid";
import { SectionHeading } from "@/components/Reveal";
import { headDict, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/menu")({
  head: ({ match }) => {
    const t = headDict(match);
    return {
      meta: [
        { title: t.meta.menuTitle },
        { name: "description", content: t.meta.menuDescription },
        { property: "og:title", content: t.meta.menuTitle },
        { property: "og:description", content: t.meta.menuDescription },
      ],
    };
  },
  component: MenuPage,
});

function MenuPage() {
  const { t } = useI18n();

  return (
    <section className="pt-40 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeading eyebrow={t.menu.eyebrow} title={t.menu.title} intro={t.menu.intro} />
        <div className="mt-16">
          <MenuGrid />
        </div>
      </div>
    </section>
  );
}
