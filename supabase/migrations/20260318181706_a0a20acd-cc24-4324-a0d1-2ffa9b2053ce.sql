CREATE TABLE public.promoter_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promoter_requests ENABLE ROW LEVEL SECURITY;

-- Users can create requests
CREATE POLICY "Users can create promoter requests"
  ON public.promoter_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own promoter requests"
  ON public.promoter_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Organizers can view requests for their org
CREATE POLICY "Organizers can view promoter requests"
  ON public.promoter_requests FOR SELECT TO authenticated
  USING (is_organizer(auth.uid(), organizer_id));

-- Organizers can update (approve/reject) requests
CREATE POLICY "Organizers can update promoter requests"
  ON public.promoter_requests FOR UPDATE TO authenticated
  USING (is_organizer(auth.uid(), organizer_id));

-- Prevent duplicate pending requests
CREATE UNIQUE INDEX idx_promoter_requests_unique_pending
  ON public.promoter_requests (user_id, organizer_id)
  WHERE status = 'pending';