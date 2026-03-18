-- Fix: Remove public (anon) access to profiles table, restrict to authenticated users only
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles publicly readable" ON public.profiles;

-- Owner can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can view basic profile info of others (needed for promoter lookups, etc.)
-- This is scoped to authenticated only - anon users cannot access profiles at all
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);