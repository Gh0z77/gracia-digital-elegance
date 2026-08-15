import { Link, useRouterState } from "@tanstack/react-router";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OrderSheet } from "@/components/OrderSheet";
import { useI18n, type Dictionary } from "@/lib/i18n";

/**
 * "Book a table" is deliberately absent here: it is the call to action on the
 * right, and listing it twice both wasted the row and, in Uzbek and Russian
 * where the label runs to sixteen characters, pushed the logo into the links.
 */
const LINKS = [
  { to: "/", key: "home" },
  { to: "/menu", key: "menu" },
  { to: "/about", key: "about" },
  { to: "/kids-zone", key: "kidsZone" },
  { to: "/contact", key: "contact" },
] as const satisfies ReadonlyArray<{ to: string; key: keyof Dictionary["nav"] }>;

/** The drawer has room for the full set. */
const DRAWER_LINKS = [
  { to: "/", key: "home" },
  { to: "/menu", key: "menu" },
  { to: "/reservations", key: "reservations" },
  { to: "/about", key: "about" },
  { to: "/kids-zone", key: "kidsZone" },
  { to: "/contact", key: "contact" },
] as const satisfies ReadonlyArray<{ to: string; key: keyof Dictionary["nav"] }>;

export function SiteHeader() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A tap on the current page's own link never fires a navigation, so close on
  // pathname change *and* on click rather than relying on either alone.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/80 backdrop-blur-xl" : ""
      }`}
    >
      <div className="mx-auto flex h-24 max-w-[1400px] items-center gap-8 px-6 lg:px-10">
        {/* Stacked lockup: on one line the "Family" tag collided with the first
            link as soon as the labels stopped being English. */}
        <Link to="/" className="shrink-0 leading-none" aria-label="Gracia Family">
          <span className="font-display block text-2xl tracking-[0.3em] text-gradient-gold">
            GRACIA
          </span>
          <span className="mt-1.5 block text-[0.5rem] tracking-[0.5em] text-muted-foreground uppercase">
            Family
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-7 xl:flex"
          aria-label={t.nav.main}
        >
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="lux-underline text-[0.68rem] whitespace-nowrap text-muted-foreground uppercase transition-colors hover:text-foreground"
              style={{ letterSpacing: "0.16em" }}
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 xl:ml-0 xl:gap-2">
          <LanguageSwitcher />
          <OrderSheet />
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <Link
            to="/reservations"
            className="hidden border border-gold/50 px-6 py-3 text-[0.62rem] tracking-[0.24em] whitespace-nowrap text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground xl:inline-block"
          >
            {t.nav.cta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.nav.close : t.nav.open}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="p-2 text-foreground xl:hidden"
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Gold hairline instead of a flat border — it only appears once the page
          has scrolled under the bar. */}
      <div
        aria-hidden
        className={`hairline transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />

      {/* Collapsed with a grid-rows transition rather than an animation library. */}
      <div
        id="mobile-nav"
        className={`grid overflow-hidden bg-background/95 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] xl:hidden ${
          open ? "grid-rows-[1fr] border-t border-border opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <nav aria-label={t.nav.main} className="min-h-0 overflow-hidden" inert={!open}>
          <div className="flex flex-col px-6 py-6">
            {DRAWER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-4 text-sm tracking-[0.18em] text-muted-foreground uppercase transition-colors last:border-0 hover:text-gold"
                activeProps={{ className: "text-gold" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {t.nav[link.key]}
              </Link>
            ))}
            <Link
              to="/reservations"
              onClick={() => setOpen(false)}
              className="mt-6 bg-gold px-6 py-4 text-center text-[0.62rem] tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft"
            >
              {t.nav.cta}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
