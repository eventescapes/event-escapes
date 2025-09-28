// src/config/dev-fallbacks.ts
import { Env } from "./env";

// Example: mock Stripe in dev if missing publishable key
export const DEV_MOCKS = {
  stripePk: Env.STRIPE_PUBLISHABLE_KEY || "pk_test_mock_only",
};