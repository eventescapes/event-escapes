import { Link } from "wouter";
import { Search, Phone, Mail, MapPin, Calendar, Shield, Award, Heart, Star, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-primary via-primary to-background overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-luxury/20 to-accent/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Find My Booking Section */}
          <div className="glass-card p-8 mb-12 text-center animate-luxury-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 bg-luxury-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Find My Booking</h2>
              <p className="text-white/80 font-accent">Enter your booking reference or email to access your travel details</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                placeholder="Booking reference or email" 
                className="glass border-white/20 text-white placeholder:text-white/60 font-accent"
                data-testid="input-booking-search"
              />
              <Button className="btn-luxury font-accent font-semibold" data-testid="button-find-booking">
                <Search className="w-4 h-4 mr-2" />
                Find Booking
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-luxury-gradient rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white">EventEscapes</h3>
              </div>
              <p className="text-white/80 font-accent leading-relaxed mb-6">
                The world's premier luxury event travel platform. Curating extraordinary experiences for discerning travelers since 2024.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-white/70 font-accent text-sm">
                  <Award className="w-4 h-4 mr-2 text-accent" />
                  Luxury Travel Awards Winner 2024
                </div>
                <div className="flex items-center text-white/70 font-accent text-sm">
                  <Star className="w-4 h-4 mr-2 text-accent" />
                  4.9/5 Average Customer Rating
                </div>
                <div className="flex items-center text-white/70 font-accent text-sm">
                  <Shield className="w-4 h-4 mr-2 text-accent" />
                  100% Secure & Protected Bookings
                </div>
              </div>
            </div>
            {/* Help & Support */}
            <div>
              <h4 className="font-display text-lg font-semibold text-white mb-4 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-accent" />
                Premium Support
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-help">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    24/7 Concierge Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-contact">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    VIP Contact Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-cancellation">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Flexible Cancellation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-safety">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Travel Safety Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-display text-lg font-semibold text-white mb-4 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-accent" />
                Our Story
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-about">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    About EventEscapes
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-careers">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Join Our Team
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-press">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Press & Media
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-blog">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Travel Inspiration
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Policies */}
            <div>
              <h4 className="font-display text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-accent" />
                Trust & Safety
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-privacy">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Privacy Protection
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-terms">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-cookies">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Cookie Preferences
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-accent transition-colors font-accent flex items-center group" data-testid="link-accessibility">
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Premium Footer Bottom */}
          <div className="border-t border-white/10 mt-12 pt-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-white/60 font-accent">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Worldwide Luxury Travel
                </div>
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  +1 (555) 123-LUXURY
                </div>
                <div className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  concierge@eventescapes.com
                </div>
              </div>
              <p className="text-white/60 font-accent text-sm">
                &copy; 2024 EventEscapes. Crafted with luxury in mind.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
