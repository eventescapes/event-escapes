/* src/config/env.ts */
type EnvKeys = {
  STRIPE_SECRET_KEY?: string;            // server-side only
  STRIPE_PUBLISHABLE_KEY?: string;       // safe for client
  DUFFEL_API_KEY?: string;               // test/live managed in Replit Secrets
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

const e = (key: keyof EnvKeys): string | undefined => {
  // Vite and Replit both surface env vars on process.env in dev
  // In Vite client code use import.meta.env.* instead – see below.
  return (typeof process !== "undefined" && process.env?.[key]) || undefined;
};

export const Env = {
  STRIPE_SECRET_KEY: e("STRIPE_SECRET_KEY"),
  STRIPE_PUBLISHABLE_KEY: e("STRIPE_PUBLISHABLE_KEY") || (import.meta as any)?.env?.VITE_STRIPE_PUBLIC_KEY,
  DUFFEL_API_KEY: e("DUFFEL_API_KEY") || (import.meta as any)?.env?.VITE_DUFFEL_API_KEY,
  SUPABASE_URL: e("SUPABASE_URL") || (import.meta as any)?.env?.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: e("SUPABASE_ANON_KEY") || (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY,
} as const;

// Soft validation: log once, don't crash builds.
let warned = false;
export function assertSecretsReady(keys: (keyof typeof Env)[]) {
  if (warned) return;
  const missing = keys.filter(k => !Env[k]);
  if (missing.length) {
    console.warn(
      "[Env] Missing secrets:", missing.join(", "),
      "→ Using test-only fallbacks where available. Set in Replit Secrets to silence this."
    );
  }
  warned = true;
}