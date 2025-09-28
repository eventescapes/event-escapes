// utils/duffel.ts
export async function fetchSeatMap(offerId: string) {
  const response = await fetch(`/api/seat-maps/${offerId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch seat map" }));
    throw new Error(errorData.message || "Failed to fetch seat map");
  }
  return await response.json();
}