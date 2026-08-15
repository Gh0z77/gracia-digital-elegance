import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Fades a block up as it scrolls into view.
 *
 * This used to be a Motion component. A page carries around twenty of them, and
 * an IntersectionObserver plus a CSS transition does the same job without the
 * animation engine tracking every one — which also keeps Motion out of the
 * bundle entirely on the pages that have no carousel.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || shown) return;

    // Anything that can't observe simply gets the content — never a page that
    // stays invisible forever.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Matches the old `viewport={{ margin: "-80px" }}`: start a little after
      // the block's edge enters, not the instant it does.
      { rootMargin: "-80px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      data-shown={shown}
      className={`reveal ${className ?? ""}`}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display mt-5 text-4xl leading-tight text-balance sm:text-5xl">{title}</h2>
      {intro && (
        <p className="mt-6 text-[0.95rem] leading-relaxed text-muted-foreground">{intro}</p>
      )}
    </Reveal>
  );
}
