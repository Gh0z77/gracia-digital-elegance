import { useMemo } from "react";

import {
  FLOOR_TABLES,
  FLOOR_VIEWBOX,
  seatPositions,
  tableFitsParty,
  tableRadius,
  ZONE_LABEL_KEY,
  type FloorTable,
} from "@/lib/floor-plan";
import { fmt, useI18n, type Dictionary } from "@/lib/i18n";

type TableState = "free" | "taken" | "small" | "selected";

function stateOf(
  table: FloorTable,
  guests: number,
  taken: Set<string>,
  chosen: string,
): TableState {
  if (chosen === table.code) return "selected";
  if (taken.has(table.code)) return "taken";
  return tableFitsParty(table, guests) ? "free" : "small";
}

/**
 * The dining room, drawn to scale.
 *
 * Guests pick a table by looking at the room rather than by reading a list of
 * codes out of a dropdown, so the plan carries the things you would notice
 * standing in the doorway: which corner the terrace is in, how far a table sits
 * from the kids' zone, how many chairs are actually around it.
 *
 * Every table is a real radio in a real radiogroup — the SVG is the presentation,
 * not the control — so the whole floor is reachable with a keyboard and reads
 * correctly to a screen reader.
 */
export function FloorPlan({
  guests,
  taken,
  value,
  onChange,
  loading,
}: {
  guests: number;
  taken: string[];
  value: string;
  onChange: (code: string) => void;
  loading: boolean;
}) {
  const { t } = useI18n();
  const takenSet = useMemo(() => new Set(taken), [taken]);

  const counts = useMemo(() => {
    let free = 0;
    for (const table of FLOOR_TABLES) {
      if (stateOf(table, guests, takenSet, value) === "free") free += 1;
    }
    return { free, total: FLOOR_TABLES.length };
  }, [guests, takenSet, value]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="eyebrow">{t.floor.title}</span>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {loading
            ? t.floor.checking
            : fmt(t.floor.freeCount, { free: counts.free, total: counts.total })}
        </span>
      </div>

      {/* The plan reaches past the card's padding to the card's own edge: inside
          it the room renders at ~540px, which puts the table codes under 10px.
          The floor is held at 560px because below that they stop being readable
          at all — on a phone it scrolls sideways rather than shrinking further. */}
      <div className="-mx-6 overflow-x-auto px-2 pb-2 sm:-mx-10">
        <svg
          role="radiogroup"
          aria-label={t.floor.title}
          viewBox={`0 0 ${FLOOR_VIEWBOX.width} ${FLOOR_VIEWBOX.height}`}
          className={`h-auto w-full min-w-[560px] transition-opacity duration-500 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {/* Walls and zones carry no meaning a screen reader needs; the tables
              that follow are the actual controls. */}
          <g aria-hidden>
            <Room t={t} />
          </g>
          {FLOOR_TABLES.map((table) => (
            <Table
              key={table.code}
              table={table}
              state={stateOf(table, guests, takenSet, value)}
              onSelect={() => onChange(value === table.code ? "" : table.code)}
              t={t}
            />
          ))}
        </svg>
      </div>

      <Legend t={t} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The room itself — walls, zones, the things you cannot book                  */
/* -------------------------------------------------------------------------- */

function Room({ t }: { t: Dictionary }) {
  const zoneLabel = "fill-muted-foreground text-[17px] tracking-[0.26em] uppercase";

  return (
    <g>
      {/* Outer wall */}
      <rect
        x={16}
        y={16}
        width={788}
        height={568}
        rx={2}
        className="fill-card stroke-border"
        strokeWidth={2}
      />

      {/* Terrace — open to the street, so its inner edge is a rail, not a wall */}
      <rect x={28} y={28} width={520} height={128} className="fill-gold/[0.04]" />
      <line
        x1={28}
        y1={156}
        x2={548}
        y2={156}
        className="stroke-gold/25"
        strokeWidth={2}
        strokeDasharray="10 8"
      />
      <text x={44} y={50} className={zoneLabel}>
        {t.floor.zoneTerrace}
      </text>

      {/* Private room */}
      <rect
        x={572}
        y={28}
        width={216}
        height={368}
        className="fill-gold/[0.05] stroke-gold/25"
        strokeWidth={1.5}
      />
      <text x={588} y={50} className={zoneLabel}>
        {t.floor.zonePrivate}
      </text>

      {/* Kids zone */}
      <rect x={28} y={432} width={352} height={140} className="fill-gold/[0.04]" />
      <line
        x1={380}
        y1={432}
        x2={380}
        y2={572}
        className="stroke-gold/20"
        strokeWidth={2}
        strokeDasharray="10 8"
      />
      <text x={44} y={456} className={zoneLabel}>
        {t.floor.zoneKids}
      </text>

      {/* Play corner — decoration, not a table */}
      <g className="fill-gold/10 stroke-gold/25" strokeWidth={1.5}>
        <circle cx={330} cy={505} r={26} />
        <circle cx={330} cy={505} r={15} />
      </g>

      <text x={44} y={214} className={zoneLabel}>
        {t.floor.zoneHall}
      </text>

      {/* Kitchen pass */}
      <rect
        x={572}
        y={424}
        width={216}
        height={148}
        className="fill-charcoal/40 stroke-border"
        strokeWidth={1.5}
      />
      <text x={588} y={452} className={zoneLabel}>
        {t.floor.kitchen}
      </text>

      {/* Bar counter along the hall's right edge */}
      <rect
        x={520}
        y={200}
        width={34}
        height={200}
        rx={17}
        className="fill-gold/10 stroke-gold/30"
        strokeWidth={1.5}
      />

      {/* Entrance — a gap in the wall with the doors swung open */}
      <g className="stroke-gold/50" strokeWidth={2.5} fill="none">
        <path d="M 432 584 A 44 44 0 0 0 476 540" />
        <line x1={432} y1={584} x2={432} y2={540} />
      </g>
      <text x={490} y={578} className={zoneLabel}>
        {t.floor.entrance}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

const TABLE_STYLE: Record<TableState, { body: string; seat: string; label: string }> = {
  free: {
    body: "fill-background stroke-gold/60 group-hover:fill-gold/15 group-hover:stroke-gold",
    seat: "fill-gold/35",
    label: "fill-foreground",
  },
  selected: {
    body: "fill-gold stroke-gold",
    seat: "fill-gold",
    label: "fill-primary-foreground",
  },
  taken: {
    body: "fill-muted/40 stroke-border",
    seat: "fill-border",
    label: "fill-muted-foreground",
  },
  small: {
    body: "fill-transparent stroke-border",
    seat: "fill-border/60",
    label: "fill-muted-foreground/60",
  },
};

function Table({
  table,
  state,
  onSelect,
  t,
}: {
  table: FloorTable;
  state: TableState;
  onSelect: () => void;
  t: Dictionary;
}) {
  const selectable = state === "free" || state === "selected";
  const style = TABLE_STYLE[state];
  const seats = seatPositions(table);
  const radius = tableRadius(table.seats);
  const width = table.width ?? 120;
  const height = table.height ?? 74;

  const zone = t.floor[ZONE_LABEL_KEY[table.zone]];

  const reason =
    state === "taken" ? t.floor.stateTaken : state === "small" ? t.floor.stateSmall : "";

  return (
    <g
      role="radio"
      aria-checked={state === "selected"}
      aria-disabled={!selectable}
      // Unavailable tables stay in the reading order but out of the tab order:
      // a guest should be told the terrace is full, not have to tab past it.
      tabIndex={selectable ? 0 : -1}
      aria-label={
        fmt(t.floor.tableLabel, { code: table.code, zone, seats: table.seats }) +
        (reason ? ` — ${reason}` : "")
      }
      onClick={selectable ? onSelect : undefined}
      onKeyDown={
        selectable
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onSelect();
            }
          : undefined
      }
      className={`group outline-none [&:focus-visible>.focus-ring]:opacity-100 ${
        selectable ? "cursor-pointer" : "cursor-not-allowed"
      }`}
    >
      {/* Focus ring drawn by hand: an SVG group takes no box-shadow. */}
      {table.shape === "round" ? (
        <circle
          className="focus-ring fill-none stroke-gold opacity-0 transition-opacity"
          cx={table.x}
          cy={table.y}
          r={radius + 22}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      ) : (
        <rect
          className="focus-ring fill-none stroke-gold opacity-0 transition-opacity"
          x={table.x - width / 2 - 22}
          y={table.y - height / 2 - 22}
          width={width + 44}
          height={height + 44}
          rx={10}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      )}

      {seats.map((seat, i) => (
        <circle
          key={i}
          cx={seat.x}
          cy={seat.y}
          r={7}
          className={`${style.seat} transition-colors duration-300`}
        />
      ))}

      {table.shape === "round" ? (
        <circle
          cx={table.x}
          cy={table.y}
          r={radius}
          strokeWidth={2}
          className={`${style.body} transition-colors duration-300`}
        />
      ) : (
        <rect
          x={table.x - width / 2}
          y={table.y - height / 2}
          width={width}
          height={height}
          rx={6}
          strokeWidth={2}
          className={`${style.body} transition-colors duration-300`}
        />
      )}

      <text
        x={table.x}
        y={table.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`${style.label} numeric pointer-events-none text-[20px] font-medium transition-colors duration-300`}
      >
        {table.code}
      </text>

      {state === "taken" && (
        <line
          x1={table.x - 16}
          y1={table.y + 15}
          x2={table.x + 16}
          y2={table.y + 15}
          className="stroke-muted-foreground"
          strokeWidth={1.5}
        />
      )}
    </g>
  );
}

function Legend({ t }: { t: Dictionary }) {
  const items = [
    { key: "free", className: "border-gold/60 bg-background", label: t.floor.legendFree },
    { key: "selected", className: "border-gold bg-gold", label: t.floor.legendSelected },
    { key: "taken", className: "border-border bg-muted/40", label: t.floor.legendTaken },
    { key: "small", className: "border-border bg-transparent", label: t.floor.legendSmall },
  ];

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2.5">
          <span className={`size-3.5 rounded-full border ${item.className}`} aria-hidden />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
