-- Add parent_ticket_id for lineage-based physical-to-digital conversion
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS parent_ticket_id uuid REFERENCES public.tickets(id) DEFAULT NULL;

-- Index for efficient lineage lookups
CREATE INDEX IF NOT EXISTS idx_tickets_parent_ticket_id ON public.tickets(parent_ticket_id) WHERE parent_ticket_id IS NOT NULL;

-- Create the atomic claim function that invalidates physical + creates digital in one transaction
CREATE OR REPLACE FUNCTION public.claim_physical_ticket(_claim_code text, _user_id uuid)
RETURNS TABLE(new_ticket_id uuid, event_id uuid, ticket_tier_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _physical record;
  _new_id uuid;
BEGIN
  -- Find and lock the physical ticket atomically
  SELECT t.id, t.event_id, t.ticket_tier_id, t.purchase_id, t.owner_user_id,
         t.status, t.fulfillment_type, t.claim_status, t.transfer_history
  INTO _physical
  FROM public.tickets t
  WHERE t.claim_code = _claim_code
    AND t.status = 'valid'
    AND t.claim_status = 'unclaimed'
    AND t.fulfillment_type IN ('physical_assigned', 'physical_unassigned')
  FOR UPDATE SKIP LOCKED;

  IF _physical IS NULL THEN
    RAISE EXCEPTION 'Ticket not found, already claimed, or not a valid physical ticket';
  END IF;

  -- STEP A: Invalidate the physical ticket
  UPDATE public.tickets SET
    status = 'claimed_physical',
    claim_status = 'claimed',
    transfer_history = COALESCE(_physical.transfer_history, '[]'::jsonb)::jsonb || jsonb_build_array(jsonb_build_object(
      'action', 'physical_to_digital_claim',
      'from_user_id', _physical.owner_user_id,
      'to_user_id', _user_id,
      'claimed_at', now()::text,
      'claim_code', _claim_code
    )),
    updated_at = now()
  WHERE id = _physical.id;

  -- STEP B: Create new digital ticket linked to physical parent
  INSERT INTO public.tickets (
    purchase_id,
    event_id,
    ticket_tier_id,
    owner_user_id,
    status,
    fulfillment_type,
    claim_status,
    claim_code,
    parent_ticket_id,
    transfer_history
  ) VALUES (
    _physical.purchase_id,
    _physical.event_id,
    _physical.ticket_tier_id,
    _user_id,
    'valid',
    'digital',
    'claimed',
    NULL,
    _physical.id,
    jsonb_build_array(jsonb_build_object(
      'action', 'created_from_physical_claim',
      'parent_ticket_id', _physical.id::text,
      'user_id', _user_id::text,
      'created_at', now()::text
    ))
  )
  RETURNING id INTO _new_id;

  RETURN QUERY SELECT _new_id, _physical.event_id, _physical.ticket_tier_id;
END;
$$;