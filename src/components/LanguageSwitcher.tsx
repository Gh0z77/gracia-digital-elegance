import { useRouter } from "@tanstack/react-router";
import { Check, Globe } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { LOCALES, LOCALE_LABELS, useI18n } from "@/lib/i18n";

/**
 * One button showing the current language, opening a small menu.
 *
 * Deliberately hand-rolled rather than pulling in a dropdown library: this sits
 * in the header on every page, and a language picker is not worth another
 * dependency in the shared bundle.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: (typeof LOCALES)[number]) {
    setOpen(false);
    buttonRef.current?.focus();
    if (next === locale) return;
    setLocale(next);
    // Route `head()` builds its titles from the router context, so the matches
    // have to be recomputed for the new language to reach <head>.
    void router.invalidate();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t.nav.language}
        className={`flex items-center gap-2 border px-3 py-2.5 text-[0.6rem] tracking-[0.22em] uppercase transition-colors duration-300 ${
          open
            ? "border-gold/50 text-gold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Globe className="size-3.5" />
        <span lang="en">{LOCALE_LABELS[locale].short}</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.nav.language}
          className="absolute top-full right-0 z-10 mt-2 min-w-[10rem] border border-border bg-background/95 py-1 shadow-[var(--shadow-soft)] backdrop-blur-xl"
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === locale}
              onClick={() => choose(code)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors ${
                code === locale
                  ? "text-gold"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Check className={`size-3.5 ${code === locale ? "opacity-100" : "opacity-0"}`} />
              {LOCALE_LABELS[code].full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
