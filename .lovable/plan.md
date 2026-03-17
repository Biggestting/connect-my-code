

## Plan: Update Supabase Environment Variables

The `VITE_SUPABASE_URL` is already correct in `.env`. The `VITE_SUPABASE_PUBLISHABLE_KEY` needs to be updated to the new value.

### Changes

1. **Update `.env`** — Replace `VITE_SUPABASE_PUBLISHABLE_KEY` with `sb_publishable_Bxkhsyw7Gi5LvaYEcKGqPg_IoueCDZz`

2. **Verify `src/integrations/supabase/client.ts`** — Already reads from `import.meta.env`, so no code changes needed there.

No other files reference the old key directly. The client initialization pattern is already correct.

