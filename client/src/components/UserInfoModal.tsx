import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ensureSupabaseInit } from '@/lib/supabase';

interface UserInfoModalProps {
  open: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    event_start_date?: string;
    venue_name?: string;
    url: string;
  };
}

export function UserInfoModal({ open, onClose, event }: UserInfoModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreeToRewards, setAgreeToRewards] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isLaunchPeriod = () => {
    return new Date() < new Date('2026-06-30');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !agreeToRewards) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and agree to earn rewards.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🎫 Preparing Ticketmaster redirect with rewards tracking...');
      
      // Get Supabase singleton client
      const { supabase, isSupabaseConfigured } = await ensureSupabaseInit();
      
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured');
      }
      
      // Generate unique click ID
      const clickId = `${event.id}_${email.toLowerCase().trim()}_${Date.now()}`;
      const userEmail = email.toLowerCase().trim();
      
      // Build clean Ticketmaster affiliate URL (only afflky param)
      const cleanUrl = event.url.split('?')[0];
      const affiliateUrl = `${cleanUrl}?afflky=6581273`;
      
      console.log('💾 Saving affiliate click tracking...', { clickId, userEmail });
      
      // Save to affiliate_clicks table
      const { error: clickError } = await supabase
        .from('affiliate_clicks')
        .insert({
          click_id: clickId,
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_start_date,
          event_venue: event.venue_name,
          user_email: userEmail,
          user_name: name.trim(),
          affiliate_id: '6581273',
          ticketmaster_url: affiliateUrl,
          clicked_at: new Date().toISOString()
        });

      if (clickError) {
        console.error('❌ Error saving click:', clickError);
        throw clickError;
      }

      console.log('✅ Click tracked successfully');
      
      // Initialize customer rewards if new user
      const { error: rewardsError } = await supabase
        .from('customer_rewards')
        .upsert({
          user_email: userEmail,
          user_name: name.trim(),
          points_balance: 0,
          campaign_type: isLaunchPeriod() ? 'launch' : 'evergreen'
        }, { 
          onConflict: 'user_email',
          ignoreDuplicates: true 
        });

      if (rewardsError && rewardsError.code !== '23505') { // Ignore duplicate key error
        console.error('❌ Error initializing rewards:', rewardsError);
      } else {
        console.log('✅ Customer rewards initialized');
      }
      
      // Open Ticketmaster in new tab
      console.log('🎟️ Opening Ticketmaster:', affiliateUrl);
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      
      // Show success message
      toast({
        title: "🎉 Opening Ticketmaster!",
        description: `You'll earn ${isLaunchPeriod() ? '$20' : '$10'} hotel credit when you complete your purchase!`,
        duration: 5000
      });
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('❌ Error processing request:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-user-info">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            🎉 Unlock Rewards!
          </DialogTitle>
          <DialogDescription>
            Complete your purchase on Ticketmaster to earn your hotel credit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Launch Banner */}
          {isLaunchPeriod() && (
            <div 
              className="p-4 rounded-lg text-center"
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#000000'
              }}
              data-testid="banner-launch"
            >
              <div className="font-bold text-lg">🎉 Unlock Your $20 Hotel Credit!</div>
              <div className="text-sm mt-1 font-semibold">Book tickets and get $20 off your next hotel stay</div>
              <div className="text-xs mt-1 opacity-75">Launch special - ends June 2026</div>
            </div>
          )}
          
          {!isLaunchPeriod() && (
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg" data-testid="banner-evergreen">
              <div className="font-semibold text-purple-900 dark:text-purple-100">
                Earn $10 hotel credit with your ticket purchase!
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agree"
                checked={agreeToRewards}
                onCheckedChange={(checked) => setAgreeToRewards(checked as boolean)}
                required
                data-testid="checkbox-agree"
              />
              <Label 
                htmlFor="agree" 
                className="text-sm leading-tight cursor-pointer"
              >
                I agree to earn rewards and receive updates about my points balance
              </Label>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                data-testid="button-submit"
              >
                {isSubmitting ? 'Opening...' : 'Continue to Ticketmaster'}
              </Button>
            </div>
          </form>
          
          <div className="text-xs text-muted-foreground text-center pt-2">
            <p>Complete your purchase on Ticketmaster to earn your hotel credit.</p>
            <p className="mt-1">Credits are automatically added within 24 hours of ticket purchase.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
