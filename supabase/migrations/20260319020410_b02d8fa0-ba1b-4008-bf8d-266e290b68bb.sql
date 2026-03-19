
-- Drop the overly-broad policy that exposes all PII to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Organizer owners/admins can view profiles of users who submitted promoter requests to their org
CREATE POLICY "Org leaders can view promoter request profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.promoter_requests pr
    JOIN public.organizer_members om ON om.organizer_id = pr.organizer_id
    WHERE pr.user_id = profiles.user_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.promoter_requests pr
    JOIN public.organizers o ON o.id = pr.organizer_id
    WHERE pr.user_id = profiles.user_id
      AND o.user_id = auth.uid()
  )
);
