ALTER TABLE public.promoters
  ADD COLUMN IF NOT EXISTS invited_email text,
  ADD COLUMN IF NOT EXISTS invite_status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promoters' AND policyname = 'Organizers can view own promoters'
  ) THEN
    CREATE POLICY "Organizers can view own promoters"
      ON public.promoters FOR SELECT TO authenticated
      USING (is_organizer(auth.uid(), organizer_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promoters' AND policyname = 'Organizers can insert promoters'
  ) THEN
    CREATE POLICY "Organizers can insert promoters"
      ON public.promoters FOR INSERT TO authenticated
      WITH CHECK (is_organizer(auth.uid(), organizer_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promoters' AND policyname = 'Organizers can update promoters'
  ) THEN
    CREATE POLICY "Organizers can update promoters"
      ON public.promoters FOR UPDATE TO authenticated
      USING (is_organizer(auth.uid(), organizer_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promoters' AND policyname = 'Organizers can delete promoters'
  ) THEN
    CREATE POLICY "Organizers can delete promoters"
      ON public.promoters FOR DELETE TO authenticated
      USING (is_organizer(auth.uid(), organizer_id));
  END IF;
END $$;