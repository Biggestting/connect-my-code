import { supabase } from "@/integrations/supabase/client";

/**
 * Apple Sign In via Supabase OAuth redirect.
 */
export async function signInWithApple(redirectUri: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: redirectUri,
    },
  });
  if (error) throw error;
  return { data, error: null };
}
