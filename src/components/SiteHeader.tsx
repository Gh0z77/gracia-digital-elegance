import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/reservations", label: "Book a Table" },
  { to: "/about", label: "About Us" },
  { to: "/kids-zone", label: "Kids Zone" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-[0.32em] text-gradient-gold">GRACIA</span>
          <span className="text-[0.6rem] tracking-[0.35em] text-muted-foreground uppercase">
            Family
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="lux-underline text-[0.7rem] tracking-[0.24em] text-muted-foreground uppercase transition-colors hover:text-foreground"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/reservations"
            className="hidden border border-gold/50 px-6 py-3 text-[0.65rem] tracking-[0.28em] text-gold uppercase transition-all duration-500 hover:bg-gold hover:text-primary-foreground sm:inline-block"
          >
            Table Reservation
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="p-2 text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm tracking-[0.2em] text-muted-foreground uppercase"
                  activeProps={{ className: "text-gold" }}
                  activeOptions={{ exact: link.to === "/" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
