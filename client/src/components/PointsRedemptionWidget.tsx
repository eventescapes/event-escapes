import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js';
import { Gift, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PointsRedemptionWidgetProps {
  bookingType: 'hotel' | 'flight' | 'package';
  onPointsApplied: (points: number, discount: number) => void;
  userEmail?: string;
}

export function PointsRedemptionWidget({ bookingType, onPointsApplied, userEmail }: PointsRedemptionWidgetProps) {
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasUser, setHasUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const email = userEmail || localStorage.getItem('userEmail');
    if (email) {
      setHasUser(true);
      fetchPointsBalance(email);
    } else {
      setHasUser(false);
      setLoading(false);
    }
  }, [userEmail]);

  const fetchPointsBalance = async (email: string) => {
    try {
      const configResponse = await fetch('/api/config/supabase');
      
      if (!configResponse.ok) {
        throw new Error('Failed to load rewards configuration');
      }
      
      const config = await configResponse.json();
      
      if (!config.isConfigured) {
        setFetchError('Rewards system not configured');
        setLoading(false);
        return;
      }

      const supabase = createClient(config.url, config.anonKey);
      
      const { data, error } = await supabase
        .from('customer_rewards')
        .select('points_balance')
        .eq('user_email', email.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found in rewards system
          setPointsBalance(0);
        } else {
          throw error;
        }
      } else {
        setPointsBalance(data?.points_balance || 0);
      }
    } catch (err: any) {
      console.error('Error fetching points:', err);
      setFetchError(err.message || 'Failed to load rewards balance');
      toast({
        title: "Rewards Error",
        description: "Unable to load your points balance. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPoints = () => {
    if (pointsBalance === null) {
      toast({
        title: "Error",
        description: "Unable to verify points balance",
        variant: "destructive"
      });
      return;
    }

    const points = parseInt(pointsToRedeem, 10);

    if (isNaN(points) || points <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid number of points",
        variant: "destructive"
      });
      return;
    }

    if (points < 500) {
      toast({
        title: "Minimum Redemption",
        description: "Minimum 500 points ($5) required for redemption",
        variant: "destructive"
      });
      return;
    }

    if (points > pointsBalance) {
      toast({
        title: "Insufficient Points",
        description: `You only have ${pointsBalance.toLocaleString()} points available`,
        variant: "destructive"
      });
      return;
    }

    if (bookingType !== 'hotel') {
      toast({
        title: "Hotel Bookings Only",
        description: "Points can only be redeemed on hotel bookings",
        variant: "destructive"
      });
      return;
    }

    const discount = points / 100;
    onPointsApplied(points, discount);
    
    toast({
      title: "Points Applied!",
      description: `${points.toLocaleString()} points applied (-$${discount.toFixed(2)})`,
    });

    setPointsToRedeem('');
  };

  const handleMaxPoints = () => {
    if (pointsBalance !== null) {
      setPointsToRedeem(pointsBalance.toString());
    }
  };

  if (loading) return null;

  // Show error state if fetch failed
  if (fetchError) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20" data-testid="card-error">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <div className="font-semibold mb-1 text-red-900 dark:text-red-100">Unable to Load Rewards</div>
            <p className="text-sm text-red-700 dark:text-red-200">
              {fetchError}. Please try refreshing the page.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show sign-in prompt if no user
  if (!hasUser) {
    return (
      <Card className="p-4 bg-slate-50 dark:bg-slate-800" data-testid="card-no-user">
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Event Escapes Rewards</div>
            <p className="text-sm text-muted-foreground">
              Sign in to view and redeem your rewards points
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (pointsBalance === null || pointsBalance < 500) {
    return (
      <Card className="p-4 bg-slate-50 dark:bg-slate-800" data-testid="card-no-points">
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Event Escapes Rewards</div>
            <p className="text-sm text-muted-foreground">
              You have {pointsBalance?.toLocaleString() || 0} points. Earn more points to redeem!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const availableValue = (pointsBalance / 100).toFixed(2);

  return (
    <Card className="p-6 border-purple-200 dark:border-purple-800" data-testid="card-points-redemption">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Redeem Your Points
          </h3>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Available</div>
            <div className="font-bold text-purple-600" data-testid="points-available">
              {pointsBalance.toLocaleString()} pts (${availableValue})
            </div>
          </div>
        </div>

        {bookingType !== 'hotel' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Points can only be redeemed on <strong>hotel bookings</strong>. Not available for flights or packages.
            </p>
          </div>
        )}

        {bookingType === 'hotel' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="points-input">Points to Redeem (100 points = $1)</Label>
              <div className="flex gap-2">
                <Input
                  id="points-input"
                  type="number"
                  min="500"
                  max={pointsBalance}
                  step="100"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder="Enter points (min. 500)"
                  data-testid="input-points"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMaxPoints}
                  data-testid="button-max-points"
                >
                  Max
                </Button>
              </div>
              {pointsToRedeem && parseInt(pointsToRedeem, 10) >= 500 && (
                <p className="text-sm text-green-600 dark:text-green-400" data-testid="discount-amount">
                  Discount: -${(parseInt(pointsToRedeem, 10) / 100).toFixed(2)}
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={handleApplyPoints}
              disabled={applying || !pointsToRedeem || parseInt(pointsToRedeem, 10) < 500}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-apply-points"
            >
              Apply Points
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Minimum redemption: 500 points ($5)
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
