/**
 * The dining room, as data.
 *
 * This is the single source of truth for the floor: the guest-facing plan draws
 * from it, and the server validates a chosen table against it before writing a
 * booking. It deliberately lives in code rather than in the database — table
 * positions are a drawing, not a record, and there is no sensible form for
 * editing an `x` coordinate. Adding or retiring a table is a one-line edit here.
 *
 * Coordinates are in the SVG user space defined by `FLOOR_VIEWBOX`; `x`/`y` is
 * the centre of the table, not its corner.
 */

export const FLOOR_VIEWBOX = { width: 820, height: 600 } as const;

export const FLOOR_ZONES = ["terrace", "hall", "kids", "private"] as const;
export type FloorZone = (typeof FLOOR_ZONES)[number];

export type TableShape = "round" | "rect";

export type FloorTable = {
  /** Shown to the guest and stored on the booking. Stable — never renumber. */
  code: string;
  zone: FloorZone;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  /** Rectangular tables only; round ones are sized from `seats`. */
  width?: number;
  height?: number;
};

export const FLOOR_TABLES: readonly FloorTable[] = [
  // Terrace — the street-facing row, best in the evening.
  { code: "T1", zone: "terrace", seats: 2, shape: "round", x: 95, y: 92 },
  { code: "T2", zone: "terrace", seats: 2, shape: "round", x: 205, y: 92 },
  { code: "T3", zone: "terrace", seats: 4, shape: "round", x: 325, y: 92 },
  { code: "T4", zone: "terrace", seats: 4, shape: "round", x: 455, y: 92 },

  // Main hall — the long room under the arches.
  { code: "A1", zone: "hall", seats: 2, shape: "round", x: 100, y: 245 },
  { code: "A2", zone: "hall", seats: 4, shape: "round", x: 225, y: 245 },
  { code: "A3", zone: "hall", seats: 4, shape: "round", x: 355, y: 245 },
  { code: "A4", zone: "hall", seats: 2, shape: "round", x: 475, y: 245 },
  { code: "A5", zone: "hall", seats: 4, shape: "rect", x: 140, y: 375, width: 120, height: 74 },
  { code: "A6", zone: "hall", seats: 6, shape: "round", x: 320, y: 378 },
  { code: "A7", zone: "hall", seats: 4, shape: "round", x: 470, y: 375 },

  // Kids zone — within sight of the play corner.
  { code: "B1", zone: "kids", seats: 4, shape: "round", x: 110, y: 505 },
  { code: "B2", zone: "kids", seats: 6, shape: "rect", x: 265, y: 505, width: 150, height: 74 },

  // Private room — the long table the family sets for celebrations.
  { code: "P1", zone: "private", seats: 8, shape: "rect", x: 685, y: 140, width: 130, height: 96 },
  {
    code: "P2",
    zone: "private",
    seats: 12,
    shape: "rect",
    x: 685,
    y: 305,
    width: 130,
    height: 130,
  },
];

/** Where each zone's name lives in the dictionary, so callers can look it up. */
export const ZONE_LABEL_KEY = {
  terrace: "zoneTerrace",
  hall: "zoneHall",
  kids: "zoneKids",
  private: "zonePrivate",
} as const satisfies Record<FloorZone, string>;

const BY_CODE = new Map(FLOOR_TABLES.map((table) => [table.code, table]));

export function findTable(code: string): FloorTable | undefined {
  return BY_CODE.get(code);
}

/**
 * A table is offerable when it is free and the party actually fits. Seating six
 * guests at a two-top is not a booking the restaurant can honour, so the plan
 * greys those out rather than letting the guest pick and be called back.
 */
export function tableFitsParty(table: FloorTable, guests: number): boolean {
  return table.seats >= guests;
}

/** Radius of a round table, grown a little with each pair of covers. */
export function tableRadius(seats: number): number {
  return 26 + Math.min(seats, 8) * 2.5;
}

/**
 * Seat positions around a table, used to draw the chairs. Round tables get an
 * even ring; rectangular ones seat guests along the two long sides, with the
 * odd remainder taking a head of the table.
 */
export function seatPositions(table: FloorTable): { x: number; y: number }[] {
  if (table.shape === "round") {
    const ring = tableRadius(table.seats) + 15;
    return Array.from({ length: table.seats }, (_, i) => {
      // Start at the top and go clockwise so a two-top reads as facing pair.
      const angle = (i / table.seats) * Math.PI * 2 - Math.PI / 2;
      return { x: table.x + Math.cos(angle) * ring, y: table.y + Math.sin(angle) * ring };
    });
  }

  const width = table.width ?? 120;
  const height = table.height ?? 74;
  const perSide = Math.floor(table.seats / 2);
  const heads = table.seats - perSide * 2;
  const seats: { x: number; y: number }[] = [];

  for (let i = 0; i < perSide; i++) {
    const step = width / (perSide + 1);
    const x = table.x - width / 2 + step * (i + 1);
    seats.push({ x, y: table.y - height / 2 - 15 });
    seats.push({ x, y: table.y + height / 2 + 15 });
  }
  // At most one head seat, since `heads` is the remainder of a division by two.
  if (heads > 0) seats.push({ x: table.x + width / 2 + 15, y: table.y });

  return seats;
}
