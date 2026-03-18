-- Revoke all privileges from anon on promoters table, then re-grant only safe columns
REVOKE ALL ON public.promoters FROM anon;

-- Re-grant SELECT on only the non-sensitive columns (excludes invited_email)
GRANT SELECT (id, organizer_id, user_id, display_name, promo_code, commission_percent, active, created_at, invite_status) ON public.promoters TO anon;