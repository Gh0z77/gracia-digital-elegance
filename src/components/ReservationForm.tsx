import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { FloorPlan } from "./FloorPlan";
import { findTable, ZONE_LABEL_KEY } from "@/lib/floor-plan";
import {
  formatSom,
  formatUzPhone,
  isCompleteUzPhone,
  todayAtRestaurant,
  RESTAURANT_TIME_ZONE,
} from "@/lib/format";
import { LOCALE_TAGS, fmt, useI18n } from "@/lib/i18n";
import { describeOrder, useOrder } from "@/lib/order";
import { settingsQuery, SETTINGS_FALLBACK } from "@/lib/queries";
import { submitReservation, tableAvailability } from "@/lib/reservations.functions";

const NOTES_LIMIT = 500;
const TIMES = ["12:00", "13:00", "14:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export function ReservationForm() {
  const { t, locale } = useI18n();
  const { lines, total, clear } = useOrder();
  const { data: settings } = useQuery(settingsQuery);
  const restaurantPhone = settings?.phone ?? SETTINGS_FALLBACK.phone;

  const [guests, setGuests] = useState(2);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [tableCode, setTableCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{
    name: string;
    guests: number;
    date: string;
    time: string;
    tableCode: string | null;
  }>();
  // A slow network turns a double-click into two bookings; the state update
  // alone is not synchronous enough to stop the second submit.
  const inFlight = useRef(false);

  const today = todayAtRestaurant();
  const book = useServerFn(submitReservation);
  const availabilityFn = useServerFn(tableAvailability);

  // Which tables are already spoken for at this exact sitting. Keyed by both
  // date and time so switching either one re-asks; kept fresh for only a minute
  // because the answer changes as other guests book.
  const availability = useQuery({
    queryKey: ["table-availability", date, time],
    queryFn: () => availabilityFn({ data: { date, time } }),
    enabled: Boolean(date && time),
    staleTime: 60_000,
  });
  const taken = availability.data?.taken ?? [];

  // A table that has just been booked by somebody else, or that no longer seats
  // the party after the guest added two more people, must not stay selected —
  // the server would refuse it at submit time.
  const chosen = tableCode ? findTable(tableCode) : undefined;
  const chosenUnavailable = Boolean(
    tableCode && (taken.includes(tableCode) || (chosen && chosen.seats < guests)),
  );
  useEffect(() => {
    if (chosenUnavailable) setTableCode("");
  }, [chosenUnavailable]);

  // Rebuilt per language so validation messages match the rest of the page.
  const schema = useMemo(
    () =>
      z.object({
        full_name: z.string().trim().min(2, t.reservation.errName).max(100),
        phone: z.string().refine(isCompleteUzPhone, t.reservation.errPhone),
        guests: z.number().int().min(1).max(30),
        reserved_date: z.string().min(1, t.reservation.errDate),
        reserved_time: z.string().min(1, t.reservation.errTime),
        notes: z.string().trim().max(NOTES_LIMIT).default(""),
      }),
    [t],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setError(null);

    // The kitchen sees one notes field, so the pre-order goes in front of it.
    const composedNotes = [describeOrder(lines, t.order.prefix), notes.trim()]
      .filter(Boolean)
      .join(" — ")
      .slice(0, NOTES_LIMIT);

    const parsed = schema.safeParse({
      full_name: fullName,
      phone,
      guests,
      reserved_date: date,
      reserved_time: time,
      notes: composedNotes,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.reservation.errForm);
      return;
    }
    if (parsed.data.reserved_date < today) {
      setError(t.reservation.errPast);
      return;
    }

    inFlight.current = true;
    setSending(true);
    // The booking goes through the server rather than straight to the database:
    // the chosen table has to be checked against the real floor plan, the race
    // for the last free one is settled by a unique index, and the restaurant is
    // messaged on the way out.
    const result = await book({ data: { ...parsed.data, table_code: tableCode, locale } }).catch(
      () => ({ ok: false as const, reason: "failed" as const }),
    );
    setSending(false);
    inFlight.current = false;

    if (!result.ok) {
      if (result.reason === "table_taken") {
        setTableCode("");
        void availability.refetch();
        setError(t.reservation.errTableTaken);
      } else if (result.reason === "throttled") {
        setError(t.reservation.errThrottled);
      } else {
        setError(fmt(t.reservation.errSend, { phone: restaurantPhone }));
      }
      return;
    }

    setDone({
      name: parsed.data.full_name,
      guests: parsed.data.guests,
      date: parsed.data.reserved_date,
      time: parsed.data.reserved_time,
      tableCode: result.tableCode,
    });
    clear();
  }

  function resetForm() {
    setDone(undefined);
    setFullName("");
    setPhone("+998 ");
    setDate("");
    setNotes("");
    setGuests(2);
    setTableCode("");
  }

  const field =
    "w-full border border-input bg-transparent px-4 py-3.5 text-sm text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground focus:border-gold";

  return (
    <div className="relative border border-border bg-card p-8 sm:p-12">
      {done ? (
        <div className="panel-enter flex flex-col items-center py-14 text-center">
          <div className="check-pop flex size-20 items-center justify-center rounded-full border border-gold">
            <Check className="size-8 text-gold" />
          </div>
          <h3 className="font-display mt-8 text-3xl">{t.reservation.doneTitle}</h3>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {fmt(t.reservation.doneBody, {
              name: done.name.split(" ")[0] ?? done.name,
              guests:
                done.guests === 1
                  ? t.reservation.guestOne
                  : fmt(t.reservation.guestMany, { count: done.guests }),
              date: new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: RESTAURANT_TIME_ZONE,
              }).format(new Date(`${done.date}T12:00:00`)),
              time: done.time,
            })}
          </p>
          {done.tableCode && (
            <p className="mt-4 text-sm text-gold">
              {fmt(t.reservation.doneTable, { code: done.tableCode })}
            </p>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="lux-underline mt-8 text-[0.6rem] tracking-[0.28em] text-muted-foreground uppercase hover:text-gold"
          >
            {t.reservation.again}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="panel-enter space-y-7">
          <div className="space-y-3">
            <span className="eyebrow block" id="guests-label">
              {t.reservation.guests}
            </span>
            <div className="flex items-center gap-6" role="group" aria-labelledby="guests-label">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                aria-label={t.reservation.fewerGuests}
                className="flex size-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Minus className="size-4" />
              </button>
              <span className="numeric w-12 text-center text-4xl" aria-live="polite">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(30, g + 1))}
                aria-label={t.reservation.moreGuests}
                className="flex size-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {guests > 8 && (
              <p className="text-xs text-muted-foreground">{t.reservation.largeParty}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="eyebrow block" htmlFor="res-name">
                {t.reservation.fullName}
              </label>
              <input
                id="res-name"
                name="name"
                autoComplete="name"
                className={field}
                value={fullName}
                maxLength={100}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.reservation.namePlaceholder}
              />
            </div>
            <div className="space-y-3">
              <label className="eyebrow block" htmlFor="res-phone">
                {t.reservation.phone}
              </label>
              <input
                id="res-phone"
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={field}
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                placeholder="+998 99 609 99 99"
              />
            </div>
            <div className="space-y-3">
              <label className="eyebrow block" htmlFor="res-date">
                {t.reservation.date}
              </label>
              <input
                id="res-date"
                type="date"
                className={field}
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="eyebrow block" htmlFor="res-time">
                {t.reservation.time}
              </label>
              <select
                id="res-time"
                className={field}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                {TIMES.map((value) => (
                  <option key={value} value={value} className="bg-card">
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* The plan needs a sitting before it can say what is free, so until a
              date is picked it stays a prompt rather than a wall of grey. */}
          <div className="border-t border-border pt-7">
            <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t.floor.intro}
            </p>

            {date ? (
              <>
                <FloorPlan
                  guests={guests}
                  taken={taken}
                  value={tableCode}
                  onChange={setTableCode}
                  loading={availability.isFetching}
                />
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm" aria-live="polite">
                    {chosen ? (
                      <span className="text-gold">
                        {fmt(t.floor.picked, {
                          code: chosen.code,
                          zone: t.floor[ZONE_LABEL_KEY[chosen.zone]],
                          seats: chosen.seats,
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t.floor.pickedNone}</span>
                    )}
                  </p>
                  {chosen && (
                    <button
                      type="button"
                      onClick={() => setTableCode("")}
                      className="flex items-center gap-2 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:text-gold"
                    >
                      <X className="size-3" /> {t.floor.clear}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                {t.floor.needDate}
              </p>
            )}
          </div>

          {lines.length > 0 && (
            <div className="border border-gold/30 bg-background/40 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="eyebrow">{t.order.attached}</p>
                <span className="numeric text-lg text-gradient-gold">{formatSom(total)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {lines.map((line) => (
                  <li key={line.id}>
                    <span className="numeric">{line.quantity}</span>× {line.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <label className="eyebrow block" htmlFor="res-notes">
              {t.reservation.notes}
            </label>
            <textarea
              id="res-notes"
              rows={3}
              maxLength={NOTES_LIMIT}
              className={field}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.reservation.notesPlaceholder}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-gold px-8 py-4 text-[0.65rem] tracking-[0.3em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft disabled:opacity-60"
          >
            {sending ? t.reservation.sending : t.reservation.submit}
          </button>
        </form>
      )}
    </div>
  );
}
