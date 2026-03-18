
-- Fix 1: Revoke public access to stripe columns on organizers table
REVOKE SELECT (stripe_account_id, stripe_onboarding_complete) ON public.organizers FROM anon;
REVOKE SELECT (stripe_account_id, stripe_onboarding_complete) ON public.organizers FROM authenticated;

-- Grant stripe column access back to the organizer owner only via a security definer function
-- The organizer can read their own stripe info via their own row (auth.uid() = user_id)
-- For server-side edge functions, the service_role bypasses RLS and column grants

-- Re-grant stripe columns to authenticated so RLS can still control access
-- We'll use a more targeted approach: grant back to authenticated but add column-level RLS via a view
-- Actually, column-level REVOKE is the cleanest approach. Let's grant it back only for the owner.
-- Postgres column grants are additive, so we grant SELECT on specific columns to authenticated
-- but the REVOKE above removed it. We need a view approach instead.

-- Better approach: Create a security definer function for organizer to get their own stripe info
CREATE OR REPLACE FUNCTION public.get_own_stripe_info(_organizer_id uuid)
RETURNS TABLE(stripe_account_id text, stripe_onboarding_complete boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.stripe_account_id, o.stripe_onboarding_complete
  FROM public.organizers o
  WHERE o.id = _organizer_id AND o.user_id = auth.uid();
$$;

-- Fix 2: Tighten reviews INSERT policy to bind user_id to auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
