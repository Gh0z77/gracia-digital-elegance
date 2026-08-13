import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { CalendarDays, LayoutGrid, LogOut, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { MENU_CATEGORIES, formatSom, type MenuItem } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Manager Access — Gracia Family" },
      { name: "description", content: "Private manager area for Gracia Family Restaurant." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Manager Access — Gracia Family" },
      { property: "og:description", content: "Private manager area." },
    ],
  }),
  component: AdminPage,
});

const field =
  "w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold";
const btnGold =
  "bg-gold px-6 py-3 text-[0.6rem] tracking-[0.28em] text-primary-foreground uppercase transition-all duration-500 hover:bg-gold-soft disabled:opacity-60";
const btnGhost =
  "border border-border px-5 py-2.5 text-[0.6rem] tracking-[0.26em] text-muted-foreground uppercase transition-colors hover:border-gold hover:text-gold";

const EMPTY_DISH = {
  name: "",
  description: "",
  category: "Main Courses",
  price: 0,
  image_url: "",
  available: true,
  featured: false,
  sort_order: 0,
};

function AdminPage() {
  const statusFn = useServerFn(adminStatus);
  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => statusFn({}) });

  if (status.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  return status.data?.unlocked ? <Dashboard /> : <Gate />;
}

function Gate() {
  const queryClient = useQueryClient();
  const login = useServerFn(adminLogin);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await login({ data: { passcode } });
    setBusy(false);
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin-status"] });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm border border-border bg-card p-10"
      >
        <p className="eyebrow">Gracia Family</p>
        <h1 className="font-display mt-4 text-3xl">Manager access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter the restaurant passcode to open the control room.
        </p>
        <input
          type="password"
          className={`${field} mt-8`}
          value={passcode}
          maxLength={100}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          autoComplete="current-password"
        />
        {error && <p className="mt-3 text-sm text-destructive">Incorrect passcode.</p>}
        <button type="submit" disabled={busy} className={`${btnGold} mt-6 w-full`}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </motion.form>
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const getData = useServerFn(adminGetData);
  const logout = useServerFn(adminLogout);
  const [tab, setTab] = useState<"menu" | "reservations" | "settings">("reservations");

  const { data, isLoading } = useQuery({ queryKey: ["admin-data"], queryFn: () => getData({}) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-data"] });

  const TABS = [
    { id: "reservations" as const, label: "Reservations", icon: CalendarDays },
    { id: "menu" as const, label: "Menu", icon: LayoutGrid },
    { id: "settings" as const, label: "Settings", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <div>
            <span className="font-display text-xl tracking-[0.3em] text-gradient-gold">GRACIA</span>
            <span className="ml-3 text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase">
              Control room
            </span>
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={async () => {
              await logout({});
              queryClient.invalidateQueries({ queryKey: ["admin-status"] });
            }}
          >
            <span className="flex items-center gap-2">
              <LogOut className="size-3.5" /> Sign out
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

        {isLoading && <p className="mt-12 text-sm text-muted-foreground">Loading…</p>}

        {data && tab === "reservations" && (
          <ReservationsPanel reservations={data.reservations} onChanged={refresh} />
        )}
        {data && tab === "menu" && <MenuPanel items={data.menu as MenuItem[]} onChanged={refresh} />}
        {data && tab === "settings" && data.settings && (
          <SettingsPanel settings={data.settings} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}

function ReservationsPanel({
  reservations,
  onChanged,
}: {
  reservations: any[];
  onChanged: () => void;
}) {
  const setStatus = useServerFn(adminSetReservationStatus);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: "pending" | "confirmed" | "cancelled" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Reservation updated");
      onChanged();
    },
    onError: () => toast.error("Could not update the reservation"),
  });

  const rows = reservations.filter(
    (r) =>
      (!filter || r.reserved_date === filter) &&
      (statusFilter === "all" || r.status === statusFilter),
  );

  const badge = (status: string) =>
    status === "confirmed"
      ? "border-gold text-gold"
      : status === "cancelled"
        ? "border-destructive text-destructive"
        : "border-border text-muted-foreground";

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="eyebrow block" htmlFor="date-filter">
            Date
          </label>
          <input
            id="date-filter"
            type="date"
            className={`${field} mt-2`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="eyebrow block" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            className={`${field} mt-2`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["all", "pending", "confirmed", "cancelled"].map((s) => (
              <option key={s} value={s} className="bg-card">
                {s}
              </option>
            ))}
          </select>
        </div>
        {(filter || statusFilter !== "all") && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setFilter("");
              setStatusFilter("all");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[0.55rem] tracking-[0.26em] text-muted-foreground uppercase">
              <th className="px-5 py-4">Guest</th>
              <th className="px-5 py-4">Phone</th>
              <th className="px-5 py-4">When</th>
              <th className="px-5 py-4">Party</th>
              <th className="px-5 py-4">Notes</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">{r.full_name}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.phone}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {r.reserved_date} · {r.reserved_time}
                </td>
                <td className="px-5 py-4">{r.guests}</td>
                <td className="max-w-[16rem] truncate px-5 py-4 text-muted-foreground">
                  {r.notes || "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`border px-3 py-1 text-[0.55rem] tracking-[0.22em] uppercase ${badge(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => mutation.mutate({ id: r.id, status: "confirmed" })}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => mutation.mutate({ id: r.id, status: "cancelled" })}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  No reservations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuPanel({ items, onChanged }: { items: MenuItem[]; onChanged: () => void }) {
  const saveDish = useServerFn(adminSaveDish);
  const deleteDish = useServerFn(adminDeleteDish);
  const [draft, setDraft] = useState<Partial<MenuItem>>(EMPTY_DISH);

  const save = useMutation({
    mutationFn: () =>
      saveDish({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name ?? "",
          description: draft.description ?? "",
          category: draft.category ?? "Main Courses",
          price: Number(draft.price ?? 0),
          image_url: draft.image_url ?? "",
          available: draft.available ?? true,
          featured: draft.featured ?? false,
          sort_order: Number(draft.sort_order ?? 0),
        },
      }),
    onSuccess: () => {
      toast.success("Dish saved");
      setDraft(EMPTY_DISH);
      onChanged();
    },
    onError: () => toast.error("Please check the dish details"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDish({ data: { id } }),
    onSuccess: () => {
      toast.success("Dish removed");
      onChanged();
    },
  });

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div className="border border-border bg-card p-8">
        <h2 className="font-display text-2xl">{draft.id ? "Edit dish" : "New dish"}</h2>
        <div className="mt-6 space-y-5">
          <input
            className={field}
            placeholder="Name"
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <textarea
            className={field}
            rows={3}
            placeholder="Italian description"
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
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
            placeholder="Price (so'm)"
            value={draft.price ?? 0}
            onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
          />
          <input
            className={field}
            placeholder="Image URL"
            value={draft.image_url ?? ""}
            onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
          />
          <input
            className={field}
            type="number"
            placeholder="Sort order"
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
              Available
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.featured ?? false}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Hero special
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={btnGold}
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : "Save dish"}
            </button>
            {draft.id && (
              <button type="button" className={btnGhost} onClick={() => setDraft(EMPTY_DISH)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-5 border border-border bg-card p-4 transition-colors hover:border-gold/40"
          >
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
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
                    Hidden
                  </span>
                )}
                {item.featured && (
                  <span className="border border-gold px-2 py-0.5 text-[0.5rem] tracking-[0.2em] text-gold uppercase">
                    Hero
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.description}</p>
              <p className="mt-1 text-sm text-gold">{formatSom(Number(item.price))}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={btnGhost} onClick={() => setDraft(item)}>
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                className="border border-border p-2.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                onClick={() => remove.mutate(item.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onChanged }: { settings: any; onChanged: () => void }) {
  const saveSettings = useServerFn(adminSaveSettings);
  const [form, setForm] = useState({
    hero_title: settings.hero_title,
    phone: settings.phone,
    address: settings.address,
    hours: settings.hours,
    instagram: settings.instagram,
  });

  const save = useMutation({
    mutationFn: () => saveSettings({ data: form }),
    onSuccess: () => {
      toast.success("Settings saved");
      onChanged();
    },
    onError: () => toast.error("Please check the values"),
  });

  const FIELDS: { key: keyof typeof form; label: string }[] = [
    { key: "hero_title", label: "Hero banner label" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "hours", label: "Operating hours" },
    { key: "instagram", label: "Instagram handle" },
  ];

  return (
    <div className="mt-10 max-w-xl border border-border bg-card p-8">
      <h2 className="font-display text-2xl">Site settings</h2>
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
          </div>
        ))}
        <button
          type="button"
          className={btnGold}
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
