
-- Sync follower_count on organizers when follows change
CREATE OR REPLACE FUNCTION public.update_organizer_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _org_id := OLD.organizer_id;
  ELSE
    _org_id := NEW.organizer_id;
  END IF;

  UPDATE public.organizers
  SET follower_count = (
    SELECT COUNT(*) FROM public.organizer_follows WHERE organizer_id = _org_id
  )
  WHERE id = _org_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_follower_count
AFTER INSERT OR DELETE ON public.organizer_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_organizer_follower_count();

-- Backfill existing counts
UPDATE public.organizers o
SET follower_count = (
  SELECT COUNT(*) FROM public.organizer_follows f WHERE f.organizer_id = o.id
);
