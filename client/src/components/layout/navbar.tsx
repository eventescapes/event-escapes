import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, User, ShoppingCart } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { RewardsWidget } from "@/components/RewardsWidget";

export default function Navbar() {
  const [location] = useLocation();
  const { getCartItemCount } = useBooking();
  const cartItemCount = getCartItemCount();

  const isActiveRoute = (route: string) => {
    return location === route || location.startsWith(route + '/');
  };

  return (
    <nav className="glass-card sticky top-0 z-50 border-b" style={{ borderColor: 'var(--glass-border-color)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left - Logo */}
          <div className="flex items-center">
            <Link href="/" data-testid="link-home">
              <h1 className="text-3xl font-display font-bold text-luxury tracking-wide cursor-pointer hover:scale-105 transition-transform duration-300">
                EventEscapes
              </h1>
            </Link>
          </div>

          {/* Center - Main Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <Link 
              href="/hotels" 
              className={`font-accent font-medium text-lg tracking-wide transition-all duration-300 hover:text-accent ${
                isActiveRoute('/hotels') 
                  ? 'text-accent border-b-2 border-accent pb-1' 
                  : 'text-secondary hover:scale-105'
              }`}
              data-testid="link-hotels"
            >
              Hotels
            </Link>
            <div className="w-px h-6 bg-border"></div>
            <Link 
              href="/flights" 
              className={`font-accent font-medium text-lg tracking-wide transition-all duration-300 hover:text-accent ${
                isActiveRoute('/flights') 
                  ? 'text-accent border-b-2 border-accent pb-1' 
                  : 'text-secondary hover:scale-105'
              }`}
              data-testid="link-flights"
            >
              Flights
            </Link>
            <div className="w-px h-6 bg-border"></div>
            <Link 
              href="/events" 
              className={`font-accent font-medium text-lg tracking-wide transition-all duration-300 hover:text-accent ${
                isActiveRoute('/events') 
                  ? 'text-accent border-b-2 border-accent pb-1' 
                  : 'text-secondary hover:scale-105'
              }`}
              data-testid="link-events"
            >
              Events
            </Link>
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="font-accent font-medium tracking-wide text-secondary hover:text-accent transition-all duration-300 hover:scale-105"
              data-testid="button-ai-planner"
            >
              <Brain className="w-5 h-5 mr-2" />
              AI Trip Planner
            </Button>
            <div className="w-px h-6 bg-border"></div>
            
            {/* Cart Icon with Badge */}
            <Link href="/cart">
              <Button 
                variant="ghost" 
                className="relative font-accent font-medium tracking-wide text-secondary hover:text-accent transition-all duration-300 hover:scale-105"
                data-testid="button-cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            
            <div className="w-px h-6 bg-border"></div>
            <RewardsWidget />
            
            <div className="w-px h-6 bg-border"></div>
            <Button 
              className="btn-luxury px-6 py-2 font-accent font-semibold tracking-wide"
              data-testid="button-signin"
            >
              <User className="w-4 h-4 mr-2" />
              Log In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
