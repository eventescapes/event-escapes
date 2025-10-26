type CreateCheckoutInput = {
  offerId: string;
  passengers: any[];
  services?: any[];
  offerData?: any;
  totalAmount?: string;
  currency?: string;
};

type CreateCheckoutResponse = {
  sessionId: string;
  url: string;
};

export async function createCheckoutSession({
  offerId,
  passengers,
  services = [],
  offerData,
  totalAmount,
  currency,
}: CreateCheckoutInput): Promise<CreateCheckoutResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const endpoint = `${supabaseUrl}/functions/v1/create-checkout-session`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerId,
      passengers,
      services,
      offerData,
      totalAmount,
      currency,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Failed to create checkout session");
  }

  return data as CreateCheckoutResponse;
}
