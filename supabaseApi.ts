export async function saveAncillaries({
  offerId,
  passengers,
  seats,
  baggage,
  totalAmount,
  currency = "AUD",
}: {
  offerId: string;
  passengers: any[];
  seats: any[];
  baggage: any[];
  totalAmount: number;
  currency?: string;
}) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-ancillaries`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        offer_id: offerId,
        passengers,
        seats,
        baggage,
        total_amount: totalAmount,
        currency,
      }),
    },
  );

  if (!res.ok) throw new Error(`saveAncillaries failed (${res.status})`);
  return await res.json();
}

export async function getBookingStatus({ offerId }: { offerId: string }) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-booking-status`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ offer_id: offerId }),
    },
  );

  if (!res.ok) throw new Error(`getBookingStatus failed (${res.status})`);
  return await res.json();
}
