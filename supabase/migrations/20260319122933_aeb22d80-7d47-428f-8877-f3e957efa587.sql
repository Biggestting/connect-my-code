-- Add time-window limit fields to ticket_tiers
ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS limit_window_start timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS limit_window_end timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS limit_window_max integer DEFAULT NULL;

-- Update check_ticket_limit to handle time-windowed limits
CREATE OR REPLACE FUNCTION public.check_ticket_limit(
  _user_id uuid,
  _event_id uuid,
  _requested_quantity integer,
  _ticket_tier_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enforce boolean;
  _max_per_user integer;
  _owned_count integer;
  _tier_enforce boolean;
  _tier_max integer;
  _tier_owned integer;
  _window_start timestamptz;
  _window_end timestamptz;
  _window_max integer;
  _window_owned integer;
  _now timestamptz := now();
BEGIN
  -- 1. Event-level limit check
  SELECT enforce_ticket_limit, max_tickets_per_user
  INTO _enforce, _max_per_user
  FROM public.events WHERE id = _event_id;

  IF _enforce AND _max_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO _owned_count
    FROM public.tickets
    WHERE event_id = _event_id AND owner_user_id = _user_id AND status IN ('valid', 'claimed_physical');
    IF _owned_count + _requested_quantity > _max_per_user THEN
      RAISE EXCEPTION 'You have reached the maximum number of tickets allowed for this event. (% owned, % requested, % max)', _owned_count, _requested_quantity, _max_per_user;
    END IF;
  END IF;

  -- 2. Tier-level checks
  IF _ticket_tier_id IS NOT NULL THEN
    SELECT enforce_limit, max_per_user, limit_window_start, limit_window_end, limit_window_max
    INTO _tier_enforce, _tier_max, _window_start, _window_end, _window_max
    FROM public.ticket_tiers WHERE id = _ticket_tier_id;

    -- 2a. Time-window limit (takes priority when active)
    IF _window_start IS NOT NULL AND _window_end IS NOT NULL AND _window_max IS NOT NULL
       AND _now >= _window_start AND _now < _window_end THEN
      SELECT COUNT(*) INTO _window_owned
      FROM public.tickets
      WHERE event_id = _event_id AND ticket_tier_id = _ticket_tier_id
        AND owner_user_id = _user_id AND status IN ('valid', 'claimed_physical');
      IF _window_owned + _requested_quantity > _window_max THEN
        RAISE EXCEPTION 'You have reached the time-limited maximum for this ticket tier. (% owned, % requested, % window max)', _window_owned, _requested_quantity, _window_max;
      END IF;
    -- 2b. Standard tier limit (fallback when outside window or no window configured)
    ELSIF _tier_enforce AND _tier_max IS NOT NULL THEN
      SELECT COUNT(*) INTO _tier_owned
      FROM public.tickets
      WHERE event_id = _event_id AND ticket_tier_id = _ticket_tier_id
        AND owner_user_id = _user_id AND status IN ('valid', 'claimed_physical');
      IF _tier_owned + _requested_quantity > _tier_max THEN
        RAISE EXCEPTION 'You have reached the maximum number of tickets allowed for this tier. (% owned, % requested, % max)', _tier_owned, _requested_quantity, _tier_max;
      END IF;
    END IF;
  END IF;
END;
$$;