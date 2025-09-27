import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <h1 className="text-2xl font-bold text-primary cursor-pointer">
                EventEscapes
              </h1>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  location === '/' ? 'text-foreground font-medium' : ''
                }`}
                data-testid="link-events"
              >
                Events
              </Link>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-destinations"
              >
                Destinations
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-support"
              >
                Support
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/find-booking" data-testid="link-find-booking">
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground"
              >
                Find My Booking
              </Button>
            </Link>
            <Button data-testid="button-signin">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
