import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">EventEscapes</h3>
            <p className="text-background/80 text-sm">
              Your gateway to unforgettable event experiences. Complete travel packages for every occasion.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-about">About Us</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-careers">Careers</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-press">Press</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-blog">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-help">Help Center</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-contact">Contact Us</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-cancellation">Cancellation</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-safety">Safety</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-terms">Terms of Service</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-cookies">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors" data-testid="link-accessibility">Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm text-background/60">
          <p>&copy; 2024 EventEscapes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
