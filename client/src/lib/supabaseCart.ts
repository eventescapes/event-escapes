export function getOrCreateSessionId(): string {
  // Check localStorage first
  let sessionId = localStorage.getItem('cart_session_id');
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  
  return sessionId;
}

export async function saveOfferToCart(offer: any) {
  const sessionId = getOrCreateSessionId();
  
  // Calculate expiry (25 minutes from now)
  const expiresAt = new Date(Date.now() + 25 * 60 * 1000).toISOString();
  
  const cartData = {
    session_id: sessionId,
    duffel_offer_id: offer.id,
    offer_json: offer,
    currency: offer.total_currency,
    expires_at: expiresAt,
  };
  
  // Save via API endpoint
  const response = await fetch('/api/cart-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cartData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save offer to cart');
  }
  
  return sessionId;
}

export async function getCartSession(sessionId: string) {
  const response = await fetch(`/api/cart-session?sid=${sessionId}`);
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data;
}

export async function clearCartSession(sessionId: string) {
  await fetch(`/api/cart-session?sid=${sessionId}`, {
    method: 'DELETE',
  });
  
  localStorage.removeItem('cart_session_id');
}
