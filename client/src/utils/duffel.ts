// utils/duffel.ts
export async function fetchSeatMap(offerId: string) {
  const response = await fetch(`https://api.duffel.com/air/seat_maps/${offerId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v1",
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Failed to fetch seat map");
  return await response.json();
}