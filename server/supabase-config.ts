// Server-side Supabase configuration
import { ServerEnv, assertSecretsReady } from "./env";

export const getSupabaseConfig = () => {
  assertSecretsReady(["SUPABASE_URL", "SUPABASE_ANON_KEY"]);
  const supabaseUrl = ServerEnv.SUPABASE_URL;
  const supabaseAnonKey = ServerEnv.SUPABASE_ANON_KEY;
  
  console.log('Supabase config check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'not found'
  });
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: !!(supabaseUrl && supabaseAnonKey)
  };
};