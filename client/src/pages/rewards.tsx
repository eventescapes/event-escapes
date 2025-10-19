import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ensureSupabaseInit } from '@/lib/supabase';
import { Award, TrendingUp, Gift, Info, Star } from 'lucide-react';

interface CustomerRewards {
  user_email: string;
  user_name: string;
  points_balance: number;
  campaign_type: string;
  tier: string;
  tier_multiplier: number;
  annual_spend: number;
  lifetime_spend: number;
}

interface PointsTransaction {
  transaction_id: string;
  user_email: string;
  points: number;
  transaction_type: string;
  source_type: string;
  description: string;
  created_at: string;
  points_balance_after: number;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<CustomerRewards | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // For demo purposes, we'll use email from localStorage or prompt
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
      fetchRewardsData(email);
    } else {
      // Prompt for email for demo
      const promptEmail = prompt('Enter your email to view rewards:');
      if (promptEmail) {
        localStorage.setItem('userEmail', promptEmail);
        setUserEmail(promptEmail);
        fetchRewardsData(promptEmail);
      } else {
        setLoading(false);
        setError('Email required to view rewards');
      }
    }
  }, []);

  const fetchRewardsData = async (email: string) => {
    try {
      console.log('💎 Fetching rewards for:', email);
      
      // Get Supabase singleton client
      const { supabase, isSupabaseConfigured } = await ensureSupabaseInit();
      
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured');
      }
      
      // Fetch customer rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('customer_rewards')
        .select('*')
        .eq('user_email', email.toLowerCase().trim())
        .single();

      if (rewardsError && rewardsError.code !== 'PGRST116') {
        throw rewardsError;
      }

      setRewards(rewardsData);
      console.log('✅ Rewards data:', rewardsData);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        throw transactionsError;
      }

      setTransactions(transactionsData || []);
      console.log('✅ Transactions:', transactionsData?.length || 0);
      
    } catch (err: any) {
      console.error('❌ Error fetching rewards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      member: { icon: '🥈', color: 'bg-gray-500', label: 'Member' },
      preferred: { icon: '🥇', color: 'bg-yellow-500', label: 'Preferred' },
      elite: { icon: '💎', color: 'bg-purple-600', label: 'Elite' }
    };
    return badges[tier.toLowerCase() as keyof typeof badges] || badges.member;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isLaunchPeriod = () => {
    return new Date() < new Date('2026-06-30');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error && !rewards) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center" data-testid="error-message">
            <h2 className="text-2xl font-bold mb-4">Unable to Load Rewards</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  const pointsValue = ((rewards?.points_balance || 0) / 100).toFixed(2);
  const tier = getTierBadge(rewards?.tier || 'member');

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2" data-testid="page-title">Event Escapes Rewards</h1>
          <p className="text-purple-100" data-testid="user-email">Welcome back, {userEmail}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Points Balance Card */}
        <Card className="p-8 bg-gradient-to-br from-purple-600 to-purple-800 text-white" data-testid="card-points-balance">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{tier.icon}</span>
                <div>
                  <div className="text-sm opacity-80">YOUR POINTS</div>
                  <div className="text-5xl font-bold" data-testid="points-balance">{rewards?.points_balance?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="text-xl opacity-90 mt-2" data-testid="points-value">
                = ${pointsValue} value
              </div>
            </div>
            <div className="text-center">
              <div className={`inline-block px-6 py-3 rounded-full ${tier.color} text-white font-bold text-lg`} data-testid="tier-badge">
                {tier.icon} {tier.label}
              </div>
              <div className="text-sm opacity-80 mt-2">
                {rewards?.tier_multiplier}x multiplier
              </div>
            </div>
          </div>
        </Card>

        {/* Launch Banner */}
        {isLaunchPeriod() && (
          <div 
            className="rounded-xl p-6 text-center shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#000000'
            }}
            data-testid="launch-banner"
          >
            <div className="inline-block px-4 py-1 bg-black/10 rounded-full text-sm font-bold mb-3">
              🎉 LAUNCH SPECIAL
            </div>
            <h2 className="text-2xl font-bold mb-2">$20 Hotel Credit per Event Ticket</h2>
            <p className="text-lg font-semibold mb-1">Valid through June 30, 2026</p>
            <p className="text-xs opacity-75 mt-2">After June 2026: $10 credit (evergreen program)</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6" data-testid="card-annual-spend">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Annual Spend</div>
                <div className="text-2xl font-bold">${rewards?.annual_spend?.toLocaleString() || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-lifetime-spend">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-sm text-muted-foreground">Lifetime Spend</div>
                <div className="text-2xl font-bold">${rewards?.lifetime_spend?.toLocaleString() || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-transactions">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* How to Earn & Redeem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6" data-testid="card-earn-points">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              How to Earn Points
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="font-semibold">🏨 Hotel Bookings</span>
                <span className="text-purple-600 font-bold">2 pts / $1</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="font-semibold">✈️ Flight Bookings</span>
                <span className="text-blue-600 font-bold">1 pt / $1</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="font-semibold">📦 Package Bookings</span>
                <span className="text-green-600 font-bold">3 pts / $1</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="font-semibold">🎫 Event Tickets</span>
                <span className="text-yellow-600 font-bold">{isLaunchPeriod() ? '$20' : '$10'} credit</span>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-redeem-points">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              How to Redeem
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Redemption Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">100 points = $1</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="font-semibold mb-2">✅ Hotels Only</div>
                <p className="text-sm text-muted-foreground">
                  Points can be redeemed on hotel bookings only. Minimum 500 points ($5) required.
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="font-semibold mb-2">❌ Not Available For</div>
                <p className="text-sm text-muted-foreground">
                  Flights, event tickets, and other services
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="p-6" data-testid="card-transaction-history">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Activity
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-transactions">
              <p>No transactions yet. Start booking to earn points!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transactions-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-right py-3 px-2">Points</th>
                    <th className="text-right py-3 px-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800" data-testid={`transaction-${transaction.transaction_id}`}>
                      <td className="py-3 px-2 text-sm">{formatDate(transaction.created_at)}</td>
                      <td className="py-3 px-2">{transaction.description}</td>
                      <td className={`py-3 px-2 text-right font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">{transaction.points_balance_after?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/events'}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
            data-testid="button-browse-events"
          >
            Browse Events & Start Earning
          </Button>
        </div>
      </div>
    </div>
  );
}
