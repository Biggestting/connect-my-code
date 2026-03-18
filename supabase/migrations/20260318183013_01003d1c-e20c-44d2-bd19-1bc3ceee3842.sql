
-- Create event_promoters table with unique referral codes per event
CREATE TABLE public.event_promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promoter_id, event_id)
);

ALTER TABLE public.event_promoters ENABLE ROW LEVEL SECURITY;

-- RLS: publicly readable (needed to resolve referral codes)
CREATE POLICY "Event promoter records publicly readable"
ON public.event_promoters FOR SELECT
TO public
USING (true);

-- RLS: active promoters can insert their own event records
CREATE POLICY "Active promoters can create event records"
ON public.event_promoters FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.promoters
    WHERE id = event_promoters.promoter_id
      AND user_id = auth.uid()
      AND invite_status = 'active'
      AND active = true
  )
);

-- Function to generate short URL-safe referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to auto-generate referral_code on insert
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    LOOP
      NEW.referral_code := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM event_promoters WHERE referral_code = NEW.referral_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_referral_code
BEFORE INSERT ON public.event_promoters
FOR EACH ROW EXECUTE FUNCTION public.auto_generate_referral_code();

-- Add referral_code to purchases for attribution tracking
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS referral_code text;

-- Fix security issue: restrict promoter_invite_tokens SELECT to organizer only
DROP POLICY IF EXISTS "Anyone authenticated can read token by value" ON public.promoter_invite_tokens;

CREATE POLICY "Organizers can read own invite tokens"
ON public.promoter_invite_tokens FOR SELECT
TO authenticated
USING (is_organizer(auth.uid(), organizer_id));
