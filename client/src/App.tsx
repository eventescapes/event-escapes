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
import CartPage from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Confirmation from "@/pages/confirmation";
import FindBooking from "@/pages/find-booking";
import EventTickets from "@/pages/event-tickets";
import { PassengerDetailsPage } from "@/pages/PassengerDetailsPage";
import { ConfirmationPage } from "@/pages/ConfirmationPage";
import { BookingSuccessPage } from "@/pages/BookingSuccessPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/hotels" component={HotelResults} />
          <Route path="/flights" component={FlightResults} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/confirmation" component={Confirmation} />
          <Route path="/passenger-details" component={PassengerDetailsPage} />
          <Route path="/booking-confirmation" component={ConfirmationPage} />
          <Route path="/booking-success" component={BookingSuccessPage} />
          <Route path="/find-booking" component={FindBooking} />
          <Route path="/event-tickets" component={EventTickets} />
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
