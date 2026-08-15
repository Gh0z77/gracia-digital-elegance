import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MenuItem } from "./format";

export type OrderLine = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

const STORAGE_KEY = "gracia:order";
const MAX_QUANTITY = 20;

type OrderContextValue = {
  lines: OrderLine[];
  count: number;
  total: number;
  add: (dish: MenuItem) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

function readStoredLines(): OrderLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isOrderLine);
  } catch {
    // Private-mode storage errors and hand-edited values both land here; an
    // empty order list is a fine outcome for either.
    return [];
  }
}

function isOrderLine(value: unknown): value is OrderLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Partial<OrderLine>;
  return (
    typeof line.id === "string" &&
    typeof line.name === "string" &&
    typeof line.price === "number" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<OrderLine[]>([]);
  // The server has no localStorage, so the first client render must match the
  // empty server output; only afterwards may the stored order appear.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStoredLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage full or blocked — the in-memory order still works for this visit.
    }
  }, [lines, hydrated]);

  const add = useCallback((dish: MenuItem) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === dish.id);
      if (existing) {
        return current.map((line) =>
          line.id === dish.id
            ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + 1) }
            : line,
        );
      }
      return [
        ...current,
        {
          id: dish.id,
          name: dish.name,
          price: Number(dish.price),
          image_url: dish.image_url,
          quantity: 1,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const next = Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(quantity)));
    setLines((current) =>
      next === 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity: next } : line)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<OrderContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, add, setQuantity, remove, clear],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used inside <OrderProvider>");
  return context;
}

/** One line per dish, short enough to survive the 500-character notes column. */
export function describeOrder(lines: OrderLine[], prefix = "Pre-order"): string {
  if (!lines.length) return "";
  return `${prefix}: ${lines.map((line) => `${line.quantity}× ${line.name}`).join(", ")}`;
}
