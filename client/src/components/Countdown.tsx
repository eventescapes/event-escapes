import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setExpired(true);
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        expired 
          ? 'bg-red-100 text-red-700' 
          : 'bg-amber-100 text-amber-700'
      }`}
      data-testid="countdown-timer"
    >
      <Clock className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-xs font-medium">
          {expired ? 'Offer Expired' : 'Offer expires in'}
        </span>
        <span className="text-lg font-bold font-mono">{timeLeft}</span>
      </div>
    </div>
  );
}
