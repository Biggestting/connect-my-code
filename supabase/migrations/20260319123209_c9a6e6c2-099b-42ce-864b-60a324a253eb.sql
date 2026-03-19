-- Add device_fingerprint to purchase_attempts for device-level tracking
ALTER TABLE public.purchase_attempts
  ADD COLUMN IF NOT EXISTS device_fingerprint text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_agent text DEFAULT NULL;

-- Add index for IP-based rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_purchase_attempts_ip_created
  ON public.purchase_attempts (ip_address, created_at DESC);

-- Add index for user-based rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_purchase_attempts_user_event_created
  ON public.purchase_attempts (user_id, event_id, created_at DESC);

-- RLS: allow service role inserts (edge function uses service role)
-- purchase_attempts already has RLS enabled via auto-enable trigger
-- Add policy for admins to read and for the edge function (service role bypasses RLS)
CREATE POLICY "Admins can view purchase attempts"
  ON public.purchase_attempts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert their own attempts (fallback if not using service role)
CREATE POLICY "Users can insert own purchase attempts"
  ON public.purchase_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);