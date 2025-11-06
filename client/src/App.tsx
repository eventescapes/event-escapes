import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookingProvider } from "@/contexts/BookingContext";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import EventDetail from "@/pages/event-detail";
import HotelResults from "@/pages/hotel-results";
import FlightResults from "@/pages/flight-results";
import AncillaryChoicePage from "@/pages/AncillaryChoicePage";
import CartPage from "@/pages/cart";
import Checkout from "@/pages/checkout";
import FindBooking from "@/pages/find-booking";
import EventTickets from "@/pages/event-tickets";
import Events from "@/pages/events";
import Rewards from "@/pages/rewards";
import { ConfirmationPage } from "@/pages/ConfirmationPage";
import { BookingSuccessPage } from "@/pages/BookingSuccessPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          {/* Main Pages */}
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/event-tickets" component={EventTickets} />

          {/* Search & Results */}
          <Route path="/hotels" component={HotelResults} />
          <Route path="/flights" component={FlightResults} />

          {/* Booking Flow */}
          <Route path="/ancillaries/:offerId" component={AncillaryChoicePage} />
          <Route path="/checkout/:offerId" component={Checkout} />
          <Route path="/cart" component={CartPage} />

          {/* Post-Payment Pages */}
          <Route path="/booking-success" component={BookingSuccessPage} />
          <Route path="/confirmation" component={ConfirmationPage} />

          {/* Utility Pages */}
          <Route path="/find-booking" component={FindBooking} />
          <Route path="/rewards" component={Rewards} />

          {/* 404 Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </BookingProvider>
    </QueryClientProvider>
  );
}

export default App;
