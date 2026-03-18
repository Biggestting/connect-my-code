
-- Revoke SELECT on the sensitive invited_email column from anonymous users
REVOKE SELECT (invited_email) ON public.promoters FROM anon;
