CREATE TABLE public.promoter_invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  commission_percent numeric NOT NULL DEFAULT 10,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promoter_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can create invite tokens"
  ON public.promoter_invite_tokens FOR INSERT TO authenticated
  WITH CHECK (is_organizer(auth.uid(), organizer_id));

CREATE POLICY "Organizers can view own invite tokens"
  ON public.promoter_invite_tokens FOR SELECT TO authenticated
  USING (is_organizer(auth.uid(), organizer_id));

CREATE POLICY "Organizers can delete own invite tokens"
  ON public.promoter_invite_tokens FOR DELETE TO authenticated
  USING (is_organizer(auth.uid(), organizer_id));

CREATE POLICY "Anyone authenticated can read token by value"
  ON public.promoter_invite_tokens FOR SELECT TO authenticated
  USING (true);