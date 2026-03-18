
-- Allow promoters to view their own commission records
CREATE POLICY "Promoters can view own commissions"
ON public.promoter_commissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.promoters
    WHERE id = promoter_commissions.promoter_id
      AND user_id = auth.uid()
  )
);

-- Allow organizers to view commissions for their promoters
CREATE POLICY "Organizers can view promoter commissions"
ON public.promoter_commissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.promoters p
    WHERE p.id = promoter_commissions.promoter_id
      AND is_organizer(auth.uid(), p.organizer_id)
  )
);
