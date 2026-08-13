import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function Intro() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-deep"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
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
              <motion.text
                x="50%"
                y="72%"
                textAnchor="middle"
                fill="none"
                stroke="url(#graciaGold)"
                strokeWidth="0.7"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "78px",
                  letterSpacing: "0.28em",
                }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              >
                GRACIA
              </motion.text>
              <motion.text
                x="50%"
                y="72%"
                textAnchor="middle"
                fill="url(#graciaGold)"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "78px",
                  letterSpacing: "0.28em",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.15, 1] }}
                transition={{ duration: 1.4, delay: 0.9 }}
              >
                GRACIA
              </motion.text>
            </svg>
            <motion.p
              className="eyebrow mt-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              Italian Family Restaurant
            </motion.p>
            <motion.div
              className="mt-10 h-px bg-gold/50"
              initial={{ width: 0 }}
              animate={{ width: 160 }}
              transition={{ delay: 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
