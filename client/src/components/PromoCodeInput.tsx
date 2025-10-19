import { useState } from 'react';
import { ensureSupabaseInit } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PromoCodeInputProps {
  bookingType: 'hotel' | 'flight' | 'package';
  bookingAmount: number;
  onPromoApplied: (promo: { code: string; discountAmount: number; promoCodeId: string } | null) => void;
}

export function PromoCodeInput({ 
  bookingType, 
  bookingAmount, 
  onPromoApplied 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    description: string;
    discountAmount: number;
    promoCodeId: string;
  } | null>(null);

  const validatePromo = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';

      const { supabase, isSupabaseConfigured } = await ensureSupabaseInit();
      
      if (!isSupabaseConfigured || !supabase) {
        setError('Promo code system not available');
        setIsValidating(false);
        return;
      }

      const { data, error: rpcError } = await supabase
        .rpc('validate_and_apply_promo', {
          p_code: promoCode.toUpperCase(),
          p_user_email: userEmail,
          p_booking_type: bookingType,
          p_booking_amount: bookingAmount
        });

      if (rpcError) throw rpcError;

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result.valid) {
        setError(result.error);
        return;
      }

      // Success!
      const promoData = {
        code: result.code,
        description: result.description,
        discountAmount: result.discount_amount,
        promoCodeId: result.promo_code_id
      };
      
      setAppliedPromo(promoData);

      // Notify parent component
      onPromoApplied({
        code: result.code,
        discountAmount: result.discount_amount,
        promoCodeId: result.promo_code_id
      });

      setError(null);
    } catch (err: any) {
      console.error('Promo validation error:', err);
      setError('Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    onPromoApplied(null);
  };

  if (appliedPromo) {
    return (
      <div 
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4"
        data-testid="promo-applied"
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100" data-testid="text-promo-code">
              ✅ Promo Applied: {appliedPromo.code}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">{appliedPromo.description}</p>
            <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1" data-testid="text-promo-discount">
              -${appliedPromo.discountAmount.toFixed(2)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removePromo}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            data-testid="button-remove-promo"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="font-semibold text-gray-900 dark:text-gray-100">Promo Code</label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter code"
          value={promoCode}
          onChange={(e) => {
            setPromoCode(e.target.value.toUpperCase());
            setError(null);
          }}
          className="flex-1"
          disabled={isValidating}
          data-testid="input-promo-code"
        />
        <Button
          onClick={validatePromo}
          disabled={isValidating || !promoCode.trim()}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-apply-promo"
        >
          {isValidating ? 'Checking...' : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" data-testid="text-promo-error">{error}</p>
      )}
    </div>
  );
}
