// Client-side session utilities for cart management

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'flight_session_id';
  
  // Try localStorage first
  try {
    let sessionId = localStorage.getItem(STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch (e) {
    // Fallback to in-memory if localStorage not available
    if (!(window as any).__sessionId) {
      (window as any).__sessionId = generateSessionId();
    }
    return (window as any).__sessionId;
  }
}

export function clearSessionId(): void {
  const STORAGE_KEY = 'flight_session_id';
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
  
  delete (window as any).__sessionId;
}
