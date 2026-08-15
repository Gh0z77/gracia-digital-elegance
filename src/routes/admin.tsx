import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, LayoutGrid, LogOut, Send, Settings2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminDeleteDish,
  adminGetData,
  adminLogin,
  adminLogout,
  adminSaveDish,
  adminSaveSettings,
  adminSetReservationStatus,
  adminStatus,
} from "@/lib/admin.functions";
import {
  MENU_CATEGORIES,
  RESERVATION_STATUSES,
  formatLongDate,
  formatSom,
  todayAtRestaurant,
  type MenuItem,
  type Reservation,
  type ReservationStatus,
  type SiteSettings,
} from "@/lib/format";
import { responsiveImage } from "@/lib/images";
import { fmt, headDict, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: ({ match }) => {
    const t = headDict(match);
    const title = `${t.admin.accessTitle} — Gracia Family`;
    return {
      meta: [
        { title },
        { name: "description", content: t.admin.accessBody },
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: t.admin.accessBody },
      ],
    };
  },
  component: AdminPage,
});

const field =
  "w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold";
const btnGold =
  "bg-gold px-6 py-3 text-[0.6rem] tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft disabled:opacity-60";
const btnGhost =
  "border border-border px-5 py-2.5 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:border-gold hover:text-gold disabled:opacity-50";

const EMPTY_DISH: Partial<MenuItem> = {
  name: "",
  description: "",
  description_uz: "",
  description_ru: "",
  category: "Main Courses",
  price: 0,
  image_url: "",
  available: true,
  featured: false,
  sort_order: 0,
};

function AdminPage() {
  const { t } = useI18n();
  const statusFn = useServerFn(adminStatus);
  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => statusFn({}) });

  if (status.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {t.admin.checkingAccess}
      </div>
    );
  }

  if (status.data?.missingConfig?.length) {
    return <SetupNotice missing={status.data.missingConfig} />;
  }

  return status.data?.unlocked ? <Dashboard /> : <Gate />;
}

/** Setup is an operator problem, not a bug — say exactly what is missing. */
function SetupNotice({ missing }: { missing: string[] }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg border border-border bg-card p-10">
        <p className="eyebrow">{t.admin.brand}</p>
        <h1 className="font-display mt-4 text-3xl">{t.admin.setupTitle}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.admin.setupBody}</p>
        <ul className="mt-6 space-y-2">
          {missing.map((key) => (
            <li key={key} className="border border-destructive/40 px-4 py-2.5 text-sm text-gold">
              {key}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t.admin.setupHint}</p>
      </div>
    </div>
  );
}

function Gate() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const login = useServerFn(adminLogin);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { passcode } });
      if (res.ok) {
        setPasscode("");
        await queryClient.invalidateQueries({ queryKey: ["admin-status"] });
        return;
      }
      setError(res.reason === "throttled" ? t.admin.throttled : t.admin.wrongPasscode);
    } catch {
      setError(t.admin.offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="panel-enter w-full max-w-sm border border-border bg-card p-10"
      >
        <p className="eyebrow">{t.admin.brand}</p>
        <h1 className="font-display mt-4 text-3xl">{t.admin.accessTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.admin.accessBody}</p>
        <label className="sr-only" htmlFor="admin-passcode">
          {t.admin.passcode}
        </label>
        <input
          id="admin-passcode"
          type="password"
          className={`${field} mt-8`}
          value={passcode}
          maxLength={200}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder={t.admin.passcode}
          autoComplete="current-password"
          autoFocus
        />
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !passcode} className={`${btnGold} mt-6 w-full`}>
          {busy ? t.admin.checking : t.admin.unlock}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const getData = useServerFn(adminGetData);
  const logout = useServerFn(adminLogout);
  const [tab, setTab] = useState<"menu" | "reservations" | "settings">("reservations");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => getData({}),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-data"] });

  const TABS = [
    { id: "reservations" as const, label: t.admin.tabReservations, icon: CalendarDays },
    { id: "menu" as const, label: t.admin.tabMenu, icon: LayoutGrid },
    { id: "settings" as const, label: t.admin.tabSettings, icon: Settings2 },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <div>
            <span className="font-display text-xl tracking-[0.3em] text-gradient-gold">GRACIA</span>
            <span className="ml-3 text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
              {t.admin.controlRoom}
            </span>
          </div>
          <button
            type="button"
            className={btnGhost}
            // Drop the cached bookings and carta outright, then force the gate
            // query to re-run. `clear()` would do the first job but it also
            // evicts the status query itself, leaving its observer with nothing
            // to invalidate — the dashboard would stay on screen until a reload.
            onClick={async () => {
              await logout({});
              queryClient.removeQueries({ queryKey: ["admin-data"] });
              await queryClient.refetchQueries({ queryKey: ["admin-status"] });
            }}
          >
            <span className="flex items-center gap-2">
              <LogOut className="size-3.5" /> {t.admin.signOut}
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
        <div className="flex flex-wrap gap-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`flex items-center gap-2 border px-5 py-2.5 text-[0.6rem] tracking-[0.26em] uppercase transition-all duration-500 ${
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="mt-12 text-sm text-muted-foreground">{t.admin.loading}</p>}

        {isError && (
          <div className="mt-12 border border-destructive/40 bg-card p-8">
            <h2 className="font-display text-2xl">{t.admin.loadErrorTitle}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t.admin.loadErrorBody}</p>
            <button type="button" className={`${btnGhost} mt-6`} onClick={() => void refetch()}>
              {t.admin.retry}
            </button>
          </div>
        )}

        {data && tab === "reservations" && (
          <>
            {/* Silence is ambiguous: an operator has no way to tell a quiet
                evening from a notifier that was never configured. */}
            <p
              className={`mt-8 flex items-center gap-2.5 text-xs ${
                data.telegramReady ? "text-muted-foreground" : "text-gold"
              }`}
            >
              <Send className="size-3.5 shrink-0" />
              {data.telegramReady ? t.admin.telegramOn : t.admin.telegramOff}
            </p>
            <ReservationsPanel reservations={data.reservations} onChanged={refresh} />
          </>
        )}
        {data && tab === "menu" && (
          <MenuPanel
            items={data.menu}
            localisationReady={data.localisationReady}
            onChanged={refresh}
          />
        )}
        {data && tab === "settings" && data.settings && (
          <SettingsPanel
            settings={data.settings}
            localisationReady={data.localisationReady}
            onChanged={refresh}
          />
        )}
        {data && tab === "settings" && !data.settings && (
          <p className="mt-12 text-sm text-muted-foreground">{t.admin.noSettingsRow}</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reservations                                                                */
/* -------------------------------------------------------------------------- */

function ReservationsPanel({
  reservations,
  onChanged,
}: {
  reservations: Reservation[];
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const setStatus = useServerFn(adminSetReservationStatus);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [search, setSearch] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: ReservationStatus }) => setStatus({ data: vars }),
    onSuccess: () => {
      toast.success(t.admin.resUpdated);
      onChanged();
    },
    onError: () => toast.error(t.admin.resUpdateFailed),
  });

  const statusLabel = (status: string) =>
    ({
      all: t.admin.statusAll,
      pending: t.admin.statusPending,
      confirmed: t.admin.statusConfirmed,
      cancelled: t.admin.statusCancelled,
    })[status] ?? status;

  const today = todayAtRestaurant();

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reservations.filter(
      (r) =>
        (!dateFilter || r.reserved_date === dateFilter) &&
        (statusFilter === "all" || r.status === statusFilter) &&
        (!needle ||
          r.full_name.toLowerCase().includes(needle) ||
          r.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, ""))),
    );
  }, [reservations, dateFilter, statusFilter, search]);

  const stats = useMemo(
    () => ({
      today: reservations.filter((r) => r.reserved_date === today && r.status !== "cancelled")
        .length,
      pending: reservations.filter((r) => r.status === "pending").length,
      upcoming: reservations.filter((r) => r.reserved_date >= today && r.status === "confirmed")
        .length,
      covers: reservations
        .filter((r) => r.reserved_date === today && r.status !== "cancelled")
        .reduce((sum, r) => sum + r.guests, 0),
    }),
    [reservations, today],
  );

  const badge = (status: string) =>
    status === "confirmed"
      ? "border-gold text-gold"
      : status === "cancelled"
        ? "border-destructive text-destructive"
        : "border-border text-muted-foreground";

  const filtered = Boolean(dateFilter) || statusFilter !== "all" || Boolean(search);

  return (
    <div className="mt-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.admin.statTables} value={stats.today} />
        <Stat label={t.admin.statCovers} value={stats.covers} />
        <Stat label={t.admin.statPending} value={stats.pending} accent={stats.pending > 0} />
        <Stat label={t.admin.statUpcoming} value={stats.upcoming} />
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-4">
        <div>
          <label className="eyebrow block" htmlFor="date-filter">
            {t.admin.filterDate}
          </label>
          <input
            id="date-filter"
            type="date"
            className={`${field} mt-2`}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="eyebrow block" htmlFor="status-filter">
            {t.admin.filterStatus}
          </label>
          <select
            id="status-filter"
            className={`${field} mt-2`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            {(["all", ...RESERVATION_STATUSES] as const).map((s) => (
              <option key={s} value={s} className="bg-card">
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[14rem] flex-1">
          <label className="eyebrow block" htmlFor="guest-search">
            {t.admin.filterSearch}
          </label>
          <input
            id="guest-search"
            className={`${field} mt-2`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.searchPlaceholder}
          />
        </div>
        <button
          type="button"
          className={btnGhost}
          onClick={() => setDateFilter(today)}
          disabled={dateFilter === today}
        >
          {t.admin.today}
        </button>
        {filtered && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setDateFilter("");
              setStatusFilter("all");
              setSearch("");
            }}
          >
            {t.admin.clear}
          </button>
        )}
      </div>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              <th className="px-5 py-4">{t.admin.colGuest}</th>
              <th className="px-5 py-4">{t.admin.colPhone}</th>
              <th className="px-5 py-4">{t.admin.colWhen}</th>
              <th className="px-5 py-4">{t.admin.colParty}</th>
              <th className="px-5 py-4">{t.admin.colTable}</th>
              <th className="px-5 py-4">{t.admin.colNotes}</th>
              <th className="px-5 py-4">{t.admin.colStatus}</th>
              <th className="px-5 py-4">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = mutation.isPending && mutation.variables?.id === r.id;
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4">{r.full_name}</td>
                  <td className="px-5 py-4">
                    <a
                      href={`tel:${r.phone.replace(/\s/g, "")}`}
                      className="text-muted-foreground transition-colors hover:text-gold"
                    >
                      {r.phone}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatLongDate(r.reserved_date)} · {r.reserved_time}
                  </td>
                  <td className="px-5 py-4">{r.guests}</td>
                  <td className="px-5 py-4">
                    {r.table_code ? (
                      <span className="numeric border border-gold/40 px-2.5 py-1 text-xs text-gold">
                        {r.table_code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t.admin.tableUnassigned}</span>
                    )}
                  </td>
                  <td className="max-w-[18rem] px-5 py-4 text-muted-foreground">
                    <span className="line-clamp-2" title={r.notes}>
                      {r.notes || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`border px-3 py-1 text-[0.55rem] tracking-[0.22em] uppercase ${badge(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy || r.status === "confirmed"}
                        onClick={() => mutation.mutate({ id: r.id, status: "confirmed" })}
                      >
                        {t.admin.confirm}
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy || r.status === "cancelled"}
                        onClick={() => mutation.mutate({ id: r.id, status: "cancelled" })}
                      >
                        {t.admin.cancel}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  {reservations.length ? t.admin.noMatch : t.admin.noReservations}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border bg-card p-6 ${accent ? "border-gold/50" : "border-border"}`}>
      <p className="eyebrow">{label}</p>
      <p className="numeric mt-3 text-4xl">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Menu                                                                        */
/* -------------------------------------------------------------------------- */

function MenuPanel({
  items,
  localisationReady,
  onChanged,
}: {
  items: MenuItem[];
  localisationReady: boolean;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const saveDish = useServerFn(adminSaveDish);
  const deleteDish = useServerFn(adminDeleteDish);
  const [draft, setDraft] = useState<Partial<MenuItem>>(EMPTY_DISH);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveDish({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name ?? "",
          description: draft.description ?? "",
          description_uz: draft.description_uz ?? "",
          description_ru: draft.description_ru ?? "",
          category: draft.category ?? "Main Courses",
          price: Number(draft.price ?? 0),
          image_url: draft.image_url ?? "",
          available: draft.available ?? true,
          featured: draft.featured ?? false,
          sort_order: Number(draft.sort_order ?? 0),
        },
      }),
    onSuccess: () => {
      toast.success(draft.id ? t.admin.dishUpdated : t.admin.dishAdded);
      setDraft(EMPTY_DISH);
      onChanged();
    },
    onError: () => toast.error(t.admin.dishSaveFailed),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDish({ data: { id } }),
    onSuccess: () => {
      toast.success(t.admin.dishRemoved);
      setPendingDelete(null);
      onChanged();
    },
    onError: () => toast.error(t.admin.dishRemoveFailed),
  });

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div className="h-fit border border-border bg-card p-8 lg:sticky lg:top-8">
        <h2 className="font-display text-2xl">{draft.id ? t.admin.editDish : t.admin.newDish}</h2>
        <div className="mt-6 space-y-5">
          <input
            className={field}
            placeholder={t.admin.dishName}
            maxLength={120}
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <textarea
            className={field}
            rows={3}
            maxLength={600}
            placeholder={`${t.admin.dishDescription} — ${t.admin.langEn}`}
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <div className="space-y-3 border-l border-border pl-4">
            <p className="eyebrow">{t.admin.translations}</p>
            {!localisationReady && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.admin.translationsLocked}
              </p>
            )}
            {localisationReady && (
              <>
                <textarea
                  className={field}
                  rows={3}
                  maxLength={600}
                  placeholder={`${t.admin.dishDescription} — ${t.admin.langUz}`}
                  value={draft.description_uz ?? ""}
                  onChange={(e) => setDraft({ ...draft, description_uz: e.target.value })}
                />
                <textarea
                  className={field}
                  rows={3}
                  maxLength={600}
                  placeholder={`${t.admin.dishDescription} — ${t.admin.langRu}`}
                  value={draft.description_ru ?? ""}
                  onChange={(e) => setDraft({ ...draft, description_ru: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t.admin.translationHint}</p>
              </>
            )}
          </div>
          <select
            className={field}
            value={draft.category ?? "Main Courses"}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {MENU_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-card">
                {c}
              </option>
            ))}
          </select>
          <input
            className={field}
            type="number"
            min={0}
            placeholder={t.admin.dishPrice}
            value={draft.price ?? 0}
            onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
          />
          <input
            className={field}
            type="url"
            placeholder={t.admin.dishImage}
            value={draft.image_url ?? ""}
            onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
          />
          {draft.image_url && (
            <img
              src={draft.image_url}
              alt=""
              className="aspect-[4/3] w-full border border-border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <input
            className={field}
            type="number"
            min={0}
            placeholder={t.admin.dishSort}
            value={draft.sort_order ?? 0}
            onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
          />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.available ?? true}
                onChange={(e) => setDraft({ ...draft, available: e.target.checked })}
              />
              {t.admin.available}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.featured ?? false}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              {t.admin.heroSpecial}
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={btnGold}
              disabled={save.isPending || !draft.name}
              onClick={() => save.mutate()}
            >
              {save.isPending ? t.admin.saving : t.admin.saveDish}
            </button>
            {draft.id && (
              <button type="button" className={btnGhost} onClick={() => setDraft(EMPTY_DISH)}>
                {t.admin.cancelEdit}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-5 border bg-card p-4 transition-colors ${
              draft.id === item.id ? "border-gold" : "border-border hover:border-gold/40"
            }`}
          >
            <img
              {...responsiveImage(item.image_url, 80)}
              alt=""
              loading="lazy"
              decoding="async"
              width={80}
              height={80}
              className="size-20 shrink-0 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-lg">{item.name}</h3>
                <span className="text-[0.55rem] tracking-[0.24em] text-muted-foreground uppercase">
                  {item.category}
                </span>
                {!item.available && (
                  <span className="border border-destructive px-2 py-0.5 text-[0.5rem] tracking-[0.2em] text-destructive uppercase">
                    {t.admin.hidden}
                  </span>
                )}
                {item.featured && (
                  <span className="border border-gold px-2 py-0.5 text-[0.5rem] tracking-[0.2em] text-gold uppercase">
                    {t.admin.heroBadge}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.description}</p>
              <p className="numeric mt-1 text-sm text-gold">{formatSom(Number(item.price))}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={btnGhost} onClick={() => setDraft(item)}>
                {t.admin.edit}
              </button>
              <button
                type="button"
                aria-label={fmt(t.admin.deleteAria, { dish: item.name })}
                className="border border-border p-2.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                onClick={() => setPendingDelete(item)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="border border-border bg-card p-8 text-sm text-muted-foreground">
            {t.admin.emptyCarta}
          </p>
        )}
      </div>

      {/* Deleting a dish is not undoable, so never let one stray click do it. */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="border-border bg-card sm:rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-normal">
              {fmt(t.admin.deleteTitle, { dish: pendingDelete?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.admin.deleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>{t.admin.deleteKeep}</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete.id);
              }}
            >
              {remove.isPending ? t.admin.deleting : t.admin.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

function SettingsPanel({
  settings,
  localisationReady,
  onChanged,
}: {
  settings: SiteSettings;
  localisationReady: boolean;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const saveSettings = useServerFn(adminSaveSettings);
  const initialForm = () => ({
    hero_title: settings.hero_title,
    hero_title_uz: settings.hero_title_uz ?? "",
    hero_title_ru: settings.hero_title_ru ?? "",
    phone: settings.phone,
    address: settings.address,
    address_uz: settings.address_uz ?? "",
    address_ru: settings.address_ru ?? "",
    hours: settings.hours,
    hours_uz: settings.hours_uz ?? "",
    hours_ru: settings.hours_ru ?? "",
    instagram: settings.instagram,
  });
  const [form, setForm] = useState(initialForm);

  const save = useMutation({
    mutationFn: () => saveSettings({ data: form }),
    onSuccess: () => {
      toast.success(t.admin.settingsSaved);
      onChanged();
    },
    onError: () => toast.error(t.admin.settingsFailed),
  });

  const FIELDS: {
    key: keyof typeof form;
    label: string;
    hint?: string;
    localised?: boolean;
  }[] = [
    {
      key: "hero_title",
      label: t.admin.fHeroTitle,
      hint: t.admin.fHeroHint,
      localised: true,
    },
    {
      key: "phone",
      label: t.admin.fPhone,
      hint: t.admin.fPhoneHint,
    },
    { key: "address", label: t.admin.fAddress, localised: true },
    { key: "hours", label: t.admin.fHours, localised: true },
    { key: "instagram", label: t.admin.fInstagram, hint: t.admin.fInstagramHint },
  ];

  const pristine = initialForm();
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some(
    (key) => form[key] !== pristine[key],
  );

  return (
    <div className="mt-10 max-w-xl border border-border bg-card p-8">
      <h2 className="font-display text-2xl">{t.admin.settingsTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.admin.settingsBody}</p>
      {!localisationReady && (
        <p className="mt-3 border border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {t.admin.translationsLocked}
        </p>
      )}
      <div className="mt-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="eyebrow block" htmlFor={`set-${f.key}`}>
              {f.label}
            </label>
            <input
              id={`set-${f.key}`}
              className={`${field} mt-2`}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
            {f.hint && <p className="mt-2 text-xs text-muted-foreground">{f.hint}</p>}
            {f.localised && localisationReady && (
              <div className="mt-3 space-y-3 border-l border-border pl-4">
                <input
                  className={field}
                  placeholder={`${f.label} — ${t.admin.langUz}`}
                  value={form[`${f.key}_uz` as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [`${f.key}_uz`]: e.target.value })}
                />
                <input
                  className={field}
                  placeholder={`${f.label} — ${t.admin.langRu}`}
                  value={form[`${f.key}_ru` as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [`${f.key}_ru`]: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{t.admin.translationHint}</p>
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-3">
          <button
            type="button"
            className={btnGold}
            disabled={save.isPending || !dirty}
            onClick={() => save.mutate()}
          >
            {save.isPending ? t.admin.saving : t.admin.settingsSave}
          </button>
          {dirty && (
            <button type="button" className={btnGhost} onClick={() => setForm(initialForm())}>
              {t.admin.settingsReset}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
