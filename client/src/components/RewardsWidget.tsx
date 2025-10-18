import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export function RewardsWidget() {
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
      fetchPoints(email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchPoints = async (email: string) => {
    try {
      const configResponse = await fetch('/api/config/supabase');
      const config = await configResponse.json();
      
      if (!config.isConfigured) {
        setLoading(false);
        return;
      }

      const supabase = createClient(config.url, config.anonKey);
      
      const { data, error } = await supabase
        .from('customer_rewards')
        .select('points_balance')
        .eq('user_email', email.toLowerCase().trim())
        .single();

      if (!error && data) {
        setPointsBalance(data.points_balance);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  
  if (!userEmail || pointsBalance === null) {
    return (
      <Link href="/rewards">
        <Button 
          variant="ghost" 
          className="font-accent font-medium tracking-wide text-secondary hover:text-accent transition-all duration-300 hover:scale-105"
          data-testid="button-rewards"
        >
          <Award className="w-5 h-5 mr-2" />
          Rewards
        </Button>
      </Link>
    );
  }

  const value = (pointsBalance / 100).toFixed(2);

  return (
    <Link href="/rewards">
      <Button 
        variant="ghost" 
        className="font-accent font-medium tracking-wide text-secondary hover:text-accent transition-all duration-300 hover:scale-105"
        data-testid="button-rewards-balance"
      >
        <Award className="w-5 h-5 mr-2 text-purple-600" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-purple-600 font-semibold">{pointsBalance.toLocaleString()} pts</span>
          <span className="text-xs text-muted-foreground">${value}</span>
        </div>
      </Button>
    </Link>
  );
}
