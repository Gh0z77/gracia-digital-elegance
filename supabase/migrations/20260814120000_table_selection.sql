-- Guests now pick their table from the floor plan, so a booking records which
-- one. The plan itself (positions, shapes, zones) lives in src/lib/floor-plan.ts
-- — it is a drawing, not a record, and there is no sensible form for editing an
-- x coordinate. What the database owns is the part that must be true no matter
-- which client is talking to it: the code is well formed, and no table is
-- promised to two parties at once.
--
-- Re-runnable: every object is dropped before it is created.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS table_code TEXT;

COMMENT ON COLUMN public.reservations.table_code IS
  'Table chosen from the floor plan, e.g. "A4". NULL means the restaurant will seat the party.';

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_table_code_format;

-- Shape only. Which codes actually exist is settled against the floor plan in
-- the server function, so retiring a table never needs a migration.
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_table_code_format
    CHECK (table_code IS NULL OR table_code ~ '^[A-Z]{1,2}[0-9]{1,2}$') NOT VALID;

/* -------------------------------------------------------------------------- */
/* One table, one party, one sitting.                                          */
/* -------------------------------------------------------------------------- */

-- The real guarantee against a double booking. Two requests racing for the last
-- free table both pass an availability check; only one can win a unique index.
-- Cancelled bookings are excluded so releasing a table frees it immediately.
DROP INDEX IF EXISTS public.reservations_table_slot_unique;

CREATE UNIQUE INDEX reservations_table_slot_unique
  ON public.reservations (table_code, reserved_date, reserved_time)
  WHERE table_code IS NOT NULL AND status <> 'cancelled';

-- The plan asks "what is taken on this date?" on every guest visit.
CREATE INDEX IF NOT EXISTS reservations_date_table_idx
  ON public.reservations (reserved_date, table_code)
  WHERE table_code IS NOT NULL;

/* -------------------------------------------------------------------------- */
/* Public inserts may set a table, but still only ever as a pending request.    */
/* -------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "Anyone can request a reservation" ON public.reservations;

CREATE POLICY "Anyone can request a reservation"
  ON public.reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND reserved_date >= CURRENT_DATE - 1
    AND reserved_date <= CURRENT_DATE + 365
  );
