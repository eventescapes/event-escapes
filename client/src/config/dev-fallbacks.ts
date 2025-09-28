// src/config/dev-fallbacks.ts
import { Env } from "./env";

// Test-only fallbacks for development - never use in production
export const DEV_MOCKS = {
  // Stripe mock keys for development
  stripePk: Env.STRIPE_PUBLISHABLE_KEY || "pk_test_51MockKey123456789abcdefghijklmnopqrstuvwxyz",
  
  // Duffel mock key for development
  duffelApiKey: Env.DUFFEL_API_KEY || "duffel_test_mock_key_development_only",
  
  // Supabase mock config for development
  supabaseUrl: Env.SUPABASE_URL || "https://mock-project.supabase.co",
  supabaseAnonKey: Env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.development.key",
};

// Only use in storybook/demo code paths; production must rely on real secrets
export const isDevelopment = () => {
  return typeof window !== "undefined" && 
         (window.location.hostname === "localhost" || 
          window.location.hostname.includes("replit"));
};