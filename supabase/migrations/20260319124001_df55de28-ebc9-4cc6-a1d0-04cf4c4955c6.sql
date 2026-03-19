
-- 1. Add unique constraint on (user_id, event_id) to prevent review spam
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_event_id_unique UNIQUE (user_id, event_id);

-- 2. Make user_id NOT NULL
ALTER TABLE public.reviews ALTER COLUMN user_id SET NOT NULL;

-- 3. Drop existing permissive insert policy and replace with purchase-verified one
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;

CREATE POLICY "Verified attendees can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.purchases
    WHERE purchases.user_id = auth.uid()
      AND purchases.event_id = reviews.event_id
      AND purchases.status = 'completed'
  )
);

-- 4. Create trigger to auto-populate user_name from profiles
CREATE OR REPLACE FUNCTION public.set_review_user_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT COALESCE(display_name, 'User')
  INTO NEW.user_name
  FROM public.profiles
  WHERE profiles.user_id = NEW.user_id;
  
  IF NEW.user_name IS NULL THEN
    NEW.user_name := 'User';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_review_user_name
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_review_user_name();
