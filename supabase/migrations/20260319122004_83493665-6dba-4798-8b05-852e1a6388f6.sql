-- Add enforce_ticket_limit boolean to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS enforce_ticket_limit boolean NOT NULL DEFAULT false;

-- Server-side function to check per-user ticket ownership before purchase
CREATE OR REPLACE FUNCTION public.check_ticket_limit(
  _user_id uuid,
  _event_id uuid,
  _requested_quantity integer
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
BEGIN
  SELECT enforce_ticket_limit, max_tickets_per_user
  INTO _enforce, _max_per_user
  FROM public.events
  WHERE id = _event_id;

  IF NOT _enforce OR _max_per_user IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO _owned_count
  FROM public.tickets
  WHERE event_id = _event_id
    AND owner_user_id = _user_id
    AND status IN ('valid', 'claimed_physical');

  IF _owned_count + _requested_quantity > _max_per_user THEN
    RAISE EXCEPTION 'You have reached the maximum number of tickets allowed for this event. (% owned, % requested, % max)',
      _owned_count, _requested_quantity, _max_per_user;
  END IF;
END;
$$;

-- Update reserve_inventory to enforce ticket limit
CREATE OR REPLACE FUNCTION public.reserve_inventory(
  _user_id uuid,
  _event_id uuid,
  _product_type text,
  _ticket_tier_id uuid DEFAULT NULL,
  _costume_product_id uuid DEFAULT NULL,
  _jouvert_package_id uuid DEFAULT NULL,
  _quantity integer DEFAULT 1,
  _ttl_minutes integer DEFAULT 8,
  _checkout_token uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _reservation_id uuid;
  _available integer;
  _expires timestamptz := now() + (_ttl_minutes || ' minutes')::interval;
  _queue_active boolean;
BEGIN
  -- Enforce per-user ticket limit for ticket purchases
  IF _product_type = 'ticket' THEN
    PERFORM check_ticket_limit(_user_id, _event_id, _quantity);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.checkout_queue
    WHERE event_id = _event_id AND status = 'waiting' LIMIT 1
  ) INTO _queue_active;

  IF _queue_active AND _checkout_token IS NULL THEN
    RAISE EXCEPTION 'Queue is active — a valid checkout token is required';
  END IF;

  IF _checkout_token IS NOT NULL THEN
    IF NOT validate_checkout_token(_checkout_token, _event_id, _user_id) THEN
      RAISE EXCEPTION 'Invalid or expired checkout token';
    END IF;
  END IF;

  UPDATE public.inventory_reservations SET status = 'released'
  WHERE user_id = _user_id AND event_id = _event_id AND status = 'held';

  IF _product_type = 'ticket' AND _ticket_tier_id IS NOT NULL THEN
    SELECT (quantity - sold_count) INTO _available FROM public.ticket_tiers WHERE id = _ticket_tier_id FOR UPDATE;
    IF _available < _quantity THEN RAISE EXCEPTION 'Insufficient ticket inventory (% available)', _available; END IF;
    UPDATE public.ticket_tiers SET sold_count = sold_count + _quantity WHERE id = _ticket_tier_id;
  ELSIF _product_type = 'costume' AND _costume_product_id IS NOT NULL THEN
    SELECT (inventory_quantity - inventory_sold) INTO _available FROM public.costume_products WHERE id = _costume_product_id FOR UPDATE;
    IF _available < _quantity THEN RAISE EXCEPTION 'Insufficient costume inventory (% available)', _available; END IF;
    UPDATE public.costume_products SET inventory_sold = inventory_sold + _quantity WHERE id = _costume_product_id;
  ELSIF _product_type = 'jouvert' AND _jouvert_package_id IS NOT NULL THEN
    SELECT (quantity - sold_count) INTO _available FROM public.jouvert_packages WHERE id = _jouvert_package_id FOR UPDATE;
    IF _available < _quantity THEN RAISE EXCEPTION 'Insufficient jouvert inventory (% available)', _available; END IF;
    UPDATE public.jouvert_packages SET sold_count = sold_count + _quantity WHERE id = _jouvert_package_id;
  ELSE
    RAISE EXCEPTION 'Invalid product type or missing product ID';
  END IF;

  INSERT INTO public.inventory_reservations (
    user_id, event_id, product_type, ticket_tier_id, costume_product_id, jouvert_package_id, quantity, expires_at
  ) VALUES (
    _user_id, _event_id, _product_type, _ticket_tier_id, _costume_product_id, _jouvert_package_id, _quantity, _expires
  ) RETURNING id INTO _reservation_id;

  RETURN _reservation_id;
END;
$$;