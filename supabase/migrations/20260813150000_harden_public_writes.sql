-- Anyone on the internet can INSERT into public.reservations with the anon key,
-- so the browser form is not a trustworthy validator. Move the guarantees the
-- restaurant actually depends on into the database itself.
--
-- Re-runnable: every object is dropped before it is created.

/* -------------------------------------------------------------------------- */
/* Shape constraints                                                           */
/* -------------------------------------------------------------------------- */

-- NOT VALID: enforced for every insert and update from here on, but existing
-- rows are left alone. Bookings taken before this migration may carry a phone
-- number in any shape, and a migration that fails on last week's data helps
-- nobody. Once the old rows are cleaned up, promote them with:
--   ALTER TABLE public.reservations VALIDATE CONSTRAINT reservations_phone_format;
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_valid,
  DROP CONSTRAINT IF EXISTS reservations_guests_range,
  DROP CONSTRAINT IF EXISTS reservations_full_name_length,
  DROP CONSTRAINT IF EXISTS reservations_phone_format,
  DROP CONSTRAINT IF EXISTS reservations_time_format,
  DROP CONSTRAINT IF EXISTS reservations_notes_length;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_valid
    CHECK (status IN ('pending', 'confirmed', 'cancelled')) NOT VALID,
  ADD CONSTRAINT reservations_guests_range
    CHECK (guests BETWEEN 1 AND 30) NOT VALID,
  ADD CONSTRAINT reservations_full_name_length
    CHECK (char_length(full_name) BETWEEN 2 AND 100) NOT VALID,
  ADD CONSTRAINT reservations_phone_format
    -- Uzbek numbers only; the restaurant confirms every booking by phone.
    CHECK (regexp_replace(phone, '\s', '', 'g') ~ '^\+998\d{9}$') NOT VALID,
  ADD CONSTRAINT reservations_time_format
    CHECK (reserved_time ~ '^([01]\d|2[0-3]):[0-5]\d$') NOT VALID,
  ADD CONSTRAINT reservations_notes_length
    CHECK (char_length(notes) <= 500) NOT VALID;

-- The carta is admin-curated and seeded by the first migration, so these can be
-- validated immediately.
ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_price_positive,
  DROP CONSTRAINT IF EXISTS menu_items_name_length,
  DROP CONSTRAINT IF EXISTS menu_items_description_length;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_price_positive CHECK (price >= 0),
  ADD CONSTRAINT menu_items_name_length CHECK (char_length(name) BETWEEN 1 AND 120),
  ADD CONSTRAINT menu_items_description_length CHECK (char_length(description) <= 600);

/* -------------------------------------------------------------------------- */
/* RLS — a public insert may only ever create a *pending* booking.             */
/* -------------------------------------------------------------------------- */

DROP POLICY IF EXISTS "Anyone can request a reservation" ON public.reservations;

CREATE POLICY "Anyone can request a reservation"
  ON public.reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    -- Date bounds live in the policy rather than in a table CHECK so that
    -- confirming or editing an old booking later never trips the constraint.
    -- CURRENT_DATE is UTC while the restaurant runs on UTC+5, hence the day of
    -- slack on the lower bound.
    AND reserved_date >= CURRENT_DATE - 1
    AND reserved_date <= CURRENT_DATE + 365
  );

/* -------------------------------------------------------------------------- */
/* Indexes for the reservations dashboard and the public menu query.           */
/* -------------------------------------------------------------------------- */

CREATE INDEX IF NOT EXISTS reservations_created_at_idx
  ON public.reservations (created_at DESC);
CREATE INDEX IF NOT EXISTS reservations_date_status_idx
  ON public.reservations (reserved_date, status);
CREATE INDEX IF NOT EXISTS menu_items_available_sort_idx
  ON public.menu_items (available, sort_order);

/* -------------------------------------------------------------------------- */
/* updated_at maintained by the database, not by whichever client remembered.  */
/* -------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
