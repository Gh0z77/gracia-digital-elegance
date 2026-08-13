import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, "Use the format +998 99 609 99 99"),
  guests: z.number().int().min(1).max(30),
  reserved_date: z.string().min(1, "Choose a date"),
  reserved_time: z.string().min(1, "Choose a time"),
  notes: z.string().trim().max(500).default(""),
});

const TIMES = ["12:00", "13:00", "14:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export function ReservationForm() {
  const [guests, setGuests] = useState(2);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse({
      full_name: fullName,
      phone,
      guests,
      reserved_date: date,
      reserved_time: time,
      notes,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSending(true);
    const { error: dbError } = await supabase.from("reservations").insert(parsed.data);
    setSending(false);
    if (dbError) {
      setError("We couldn't send your request. Please call us instead.");
      return;
    }
    setDone(true);
  }

  const field =
    "w-full border border-input bg-transparent px-4 py-3.5 text-sm text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground focus:border-gold";

  return (
    <div className="relative border border-border bg-card p-8 sm:p-12">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center py-14 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
              className="flex size-20 items-center justify-center rounded-full border border-gold"
            >
              <Check className="size-8 text-gold" />
            </motion.div>
            <h3 className="font-display mt-8 text-3xl">Your table is requested</h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Grazie, {fullName.split(" ")[0]}. We'll confirm {guests}{" "}
              {guests === 1 ? "guest" : "guests"} on {date} at {time} by phone shortly.
            </p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="lux-underline mt-8 text-[0.6rem] tracking-[0.28em] text-muted-foreground uppercase hover:text-gold"
            >
              Book another table
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-7"
          >
            <div className="space-y-3">
              <label className="eyebrow block">Guests</label>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  aria-label="Fewer guests"
                  className="flex size-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  <Minus className="size-4" />
                </button>
                <span className="font-display w-12 text-center text-4xl">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(30, g + 1))}
                  aria-label="More guests"
                  className="flex size-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="eyebrow block" htmlFor="res-name">
                  Full name
                </label>
                <input
                  id="res-name"
                  className={field}
                  value={fullName}
                  maxLength={100}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nodira Karimova"
                />
              </div>
              <div className="space-y-3">
                <label className="eyebrow block" htmlFor="res-phone">
                  Phone
                </label>
                <input
                  id="res-phone"
                  className={field}
                  value={phone}
                  maxLength={20}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 99 609 99 99"
                />
              </div>
              <div className="space-y-3">
                <label className="eyebrow block" htmlFor="res-date">
                  Date
                </label>
                <input
                  id="res-date"
                  type="date"
                  className={field}
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="eyebrow block" htmlFor="res-time">
                  Time
                </label>
                <select
                  id="res-time"
                  className={field}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  {TIMES.map((t) => (
                    <option key={t} value={t} className="bg-card">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="eyebrow block" htmlFor="res-notes">
                Special requests
              </label>
              <textarea
                id="res-notes"
                rows={3}
                maxLength={500}
                className={field}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Birthday table, high chair, quiet corner…"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft disabled:opacity-60"
            >
              {sending ? "Sending…" : "Confirm reservation"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
