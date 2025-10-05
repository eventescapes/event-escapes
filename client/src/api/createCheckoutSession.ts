type CreateCheckoutInput = {
  offerId: string;
  passengers: any[];   // already normalized with mapPassengers()
  services?: any[];
};

type CreateCheckoutResponse = {
  sessionId: string;
  url: string;
};

export async function createCheckoutSession(
  { offerId, passengers, services = [] }: CreateCheckoutInput
): Promise<CreateCheckoutResponse> {
  // Prefer explicit override; otherwise derive from Supabase URL.
  const directUrl = import.meta.env.VITE_CREATE_CHECKOUT_URL as string | undefined;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  const endpoint = directUrl
    ?? (supabaseUrl
          ? `${supabaseUrl}/functions/v1/create-checkout-session`
          : undefined);

  if (!endpoint) {
    throw new Error(
      "Missing endpoint. Set VITE_CREATE_CHECKOUT_URL or VITE_SUPABASE_URL in your environment."
    );
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, passengers, services }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Failed to create checkout session (${res.status})`);
  }

  // Expected shape from your edge function
  if (!data?.url || !data?.sessionId) {
    throw new Error("Malformed response from create-checkout-session");
  }

  return data as CreateCheckoutResponse;
}
