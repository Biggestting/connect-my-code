
-- Drop the overly permissive public SELECT policy that exposes invited_email
DROP POLICY IF EXISTS "Promoters publicly readable" ON public.promoters;

-- Restricted public policy: only active promoters visible, limits exposure scope
CREATE POLICY "Public can read active promoter codes"
ON public.promoters
FOR SELECT
TO public
USING (active = true AND invite_status = 'active');

-- Promoters can see their own record (organizer policy already exists)
CREATE POLICY "Promoters can view own record"
ON public.promoters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can see all promoters
CREATE POLICY "Admins can view all promoters"
ON public.promoters
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
