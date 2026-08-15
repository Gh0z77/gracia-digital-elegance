import { useEffect, useState, type CSSProperties } from "react";

import { useI18n } from "@/lib/i18n";

// The curtain is a brand moment, not a loading screen — the page underneath is
// already server-rendered and painted. Keep it short, and only once a visit:
// sitting through it again on every navigation reads as a broken site.
const HOLD_MS = 1100;
const FADE_MS = 450;
const SEEN_KEY = "gracia:intro-seen";

function alreadySeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Private mode or blocked storage — showing the curtain once more is fine.
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* nothing to do */
  }
}

// SVG text can't pick up the `font-display` utility, so restate it here — the
// curtain logo and the header logo have to be the same letterform and weight.
const LOGO_TYPE: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "72px",
  fontWeight: 600,
  fontVariationSettings: '"SOFT" 28, "WONK" 0',
  letterSpacing: "0.28em",
};

/**
 * Animated entirely in CSS. This renders on every page, so keeping Motion out of
 * it is what lets the menu, about, kids-zone and contact pages ship without the
 * animation engine at all.
 */
export function Intro() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  // Unmounted once the fade has finished, so the overlay can never sit
  // invisibly on top of the page swallowing clicks.
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (alreadySeen()) {
      setSkipped(true);
      return;
    }
    markSeen();
    const timer = setTimeout(() => setDone(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  // Nobody should be able to scroll a page they cannot see yet, and a stray
  // keypress or tap should be able to skip the curtain.
  useEffect(() => {
    if (skipped || done) return;
    const skip = () => setDone(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [done, skipped]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setRemoved(true), FADE_MS);
    return () => clearTimeout(timer);
  }, [done]);

  if (skipped || removed) return null;

  return (
    <div
      // Purely decorative: the page underneath already carries the content, so
      // assistive tech should walk straight past it.
      aria-hidden
      data-done={done}
      className="intro-curtain fixed inset-0 z-[100] flex items-center justify-center bg-slate-deep"
    >
      <div className="veil pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <svg viewBox="0 0 520 120" className="w-[70vw] max-w-[520px]" aria-hidden="true">
          <defs>
            <linearGradient id="graciaGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.06 82)" />
              <stop offset="50%" stopColor="oklch(0.95 0.06 90)" />
              <stop offset="100%" stopColor="oklch(0.72 0.06 82)" />
            </linearGradient>
          </defs>
          <text
            x="50%"
            y="72%"
            textAnchor="middle"
            fill="none"
            stroke="url(#graciaGold)"
            strokeWidth="0.7"
            style={LOGO_TYPE}
            className="intro-stroke"
          >
            GRACIA
          </text>
          <text
            x="50%"
            y="72%"
            textAnchor="middle"
            fill="url(#graciaGold)"
            style={LOGO_TYPE}
            className="intro-fill"
          >
            GRACIA
          </text>
        </svg>
        <p className="eyebrow intro-tagline mt-6">{t.intro.tagline}</p>
        <div className="intro-rule mt-10 h-px bg-gold/50" />
      </div>
    </div>
  );
}
