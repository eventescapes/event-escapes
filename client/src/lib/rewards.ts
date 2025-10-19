import { ensureSupabaseInit } from '@/lib/supabase';

interface AwardPointsParams {
  userEmail: string;
  bookingType: 'hotel' | 'flight' | 'package';
  amount: number;
  bookingReference: string;
  description?: string;
}

/**
 * SECURITY NOTE: This function calculates points but does NOT award them directly.
 * Actual points awarding MUST be done server-side via:
 * 1. Backend API endpoint with authentication
 * 2. Supabase Edge Function with service role key
 * 3. Webhook after payment confirmation
 * 
 * NEVER call Supabase RPC functions directly from the client for awarding points!
 */
export function calculateBookingPoints(params: AwardPointsParams): { points: number; description: string } {
  const { userEmail, bookingType, amount, bookingReference, description } = params;

  console.log('💎 Calculating points for booking:', { userEmail, bookingType, amount, bookingReference });

  // Calculate points based on booking type (without tier multiplier - that's server-side)
  const rates = {
    hotel: 2,
    flight: 1,
    package: 3
  };
  
  const baseRate = rates[bookingType] || 1;
  const points = Math.floor(amount * baseRate);
  
  console.log('💎 Calculated base points:', { baseRate, points });

  return {
    points,
    description: description || `${bookingType} booking`
  };
}

/**
 * Award points through backend API endpoint (server-side only)
 * This is a placeholder - implement your backend endpoint to handle this securely
 */
export async function awardBookingPoints(params: AwardPointsParams): Promise<{ success: boolean; points: number; error?: string }> {
  console.warn('⚠️ awardBookingPoints should be called from server-side only!');
  console.warn('⚠️ Points are awarded automatically by backend webhooks after booking confirmation');
  
  // Return calculated points for display purposes only
  const { points } = calculateBookingPoints(params);
  
  return {
    success: true,
    points,
    error: 'Points will be awarded automatically by the backend after booking confirmation'
  };
}

export async function redeemPoints(params: {
  userEmail: string;
  points: number;
  bookingReference: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userEmail, points, bookingReference, description } = params;

  try {
    console.log('💎 Redeeming points:', { userEmail, points, bookingReference });

    // Get Supabase singleton client
    const { supabase, isSupabaseConfigured } = await ensureSupabaseInit();
    
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Rewards system not configured' };
    }

    // Redeem points using Supabase RPC function
    const { error: redeemError } = await supabase.rpc('redeem_points_hotels_only', {
      p_user_email: userEmail.toLowerCase().trim(),
      p_points: points,
      p_booking_type: 'hotel',
      p_booking_reference: bookingReference,
      p_description: description || `Redeemed on hotel booking #${bookingReference}`
    });

    if (redeemError) {
      console.error('❌ Error redeeming points:', redeemError);
      return { success: false, error: redeemError.message };
    }

    console.log('✅ Points redeemed successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error in redeemPoints:', error);
    return { success: false, error: error.message };
  }
}
