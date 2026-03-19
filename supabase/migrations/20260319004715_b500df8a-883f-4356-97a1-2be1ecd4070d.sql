CREATE POLICY "Admins can delete organizers"
ON public.organizers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));