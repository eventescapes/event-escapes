/* server/env.ts */
type EnvKeys = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  DUFFEL_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const e = (key: keyof EnvKeys): string | undefined => {
  return process.env[key];
};

export const ServerEnv = {
  STRIPE_SECRET_KEY: e("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: e("STRIPE_WEBHOOK_SECRET"),
  DUFFEL_API_KEY: e("DUFFEL_API_KEY"),
  SUPABASE_URL: e("SUPABASE_URL") || e("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: e("SUPABASE_ANON_KEY") || e("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
} as const;

// Soft validation: log once, don't crash builds.
let warned = false;
export function assertSecretsReady(keys: (keyof typeof ServerEnv)[]) {
  if (warned) return;
  const missing = keys.filter(k => !ServerEnv[k]);
  if (missing.length) {
    console.warn(
      "[ServerEnv] Missing secrets:", missing.join(", "),
      "→ Some functionality will be disabled. Set in Replit Secrets to enable."
    );
  }
  warned = true;
}