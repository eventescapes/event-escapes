# EventEscapes - Premium Event-Focused Travel Platform

## Overview

EventEscapes is a premium luxury online travel agency (OTA) that specializes in event-focused travel experiences. The platform helps users discover events and book complete travel packages including accommodations, flights, and event tickets. Built with a modern React/Express.js full-stack architecture, the application emphasizes a clean, mobile-first design with glassmorphism effects and a sophisticated color palette featuring rich navy/black primary colors with luxury gold and teal accents.

The platform follows a streamlined 3-4 step user flow: search and discover events, select accommodations/flights/tickets, review and pay, and receive confirmation. The application targets discerning travelers seeking curated, premium event experiences with an emphasis on luxury design and seamless user experience.

## Recent Changes (October 26, 2025)

### Duffel Flights Bug Fixes
Fixed three critical issues in the flights booking flow:

1. **Confirmation Page Amount Display** - Updated stripe-webhook to store complete booking data in Deno KV, including actual amount from Duffel order (not Stripe session), ensuring confirmation page shows correct total instead of $0.00

2. **Services Data Persistence** - Enhanced stripe-webhook to store enriched services data (seats/baggage) with full details (id, type, quantity, description, amount, currency) so confirmation page can display meaningful services breakdown with prices

3. **Flight Search Form State** - Added sessionStorage persistence to FlightSearchForm component, preventing form data loss when using browser back button

### Technical Details
- Stripe webhook now stores `duffelPassengers` (snake_case format) instead of `parsedPassengers` (camelCase) to match confirmation page expectations
- Booking amount sourced from `order.total_amount` (Duffel's authoritative amount) instead of `session.amount_total` (Stripe)
- Services enriched with descriptions and pricing for proper cart/confirmation display
- Cart store includes getTotal(), getSeats(), getBaggage() helper methods
- Back navigation added to AncillaryChoicePage and PassengerDetailsPage
- "Change flight" functionality in TripSummary with cart clearing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API for booking state management and TanStack Query for server state
- **UI Framework**: Shadcn/ui component library with Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for the luxury design system, featuring glassmorphism effects and premium typography (Playfair Display for headlines, Inter for body text, Montserrat for accents)
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite with custom configuration for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints following `/api/*` pattern
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Middleware**: Custom logging, JSON parsing, and CORS handling
- **Development**: Hot module replacement and runtime error overlay integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: Users, events, bookings, booking items, and saved items with proper relationships
- **Data Types**: Support for JSON fields, decimal precision for prices, geographic coordinates

### Authentication and Authorization
- **Current State**: Basic user management schema prepared but authentication not fully implemented
- **User Model**: Email-based user accounts with optional username and password fields
- **Guest Checkout**: Primary flow supports guest checkout without account creation
- **Future Implementation**: Prepared for Stripe customer integration and user session management

### Payment Processing
- **Primary**: Stripe integration for card payments with payment intents
- **Secondary**: NowPayments integration for cryptocurrency payments
- **Checkout Flow**: Single-step checkout with guest information collection
- **Security**: Stripe-hosted payment elements for PCI compliance

#### Event Escapes Rewards Program
- **Launch Campaign**: $20 hotel credit per event ticket purchase (active until June 30, 2026)
- **Evergreen Program**: $10 hotel credit per event ticket (begins July 1, 2026)
- **Points System**: Hotels 2pts/$1, Flights 1pt/$1, Packages 3pts/$1
- **Redemption**: 100 points = $1, minimum 1,000 points ($10) required
- **Eligibility**: Hotels and packages (with hotel component) only - flight-only and event-only bookings excluded
- **Checkout Integration**: Real-time discount preview, combined with promo codes, automatic Supabase redemption after payment
- **Tier System**: Member (1x), Preferred (1.2x), Elite (1.5x) multipliers based on annual spend
- **Affiliate Integration**: Ticketmaster affiliate tracking with automatic credit awarding via webhooks

## External Service Integrations
- **Flight Booking**: Duffel API integration through Supabase Edge Functions for flight search and booking
- **Hotel Search**: Supabase Edge Functions for hotel availability and booking
- **Event Tickets**: Ticketmaster API with affiliate tracking (ID: 6581273), webhook-based reward processing
  - **Dynamic Event Display**: Netflix-style carousels with 3-4 month rolling window (7 days to 4 months from today)
  - **Smart Categorization**: Events automatically organized into categories (Happening Soon, Sports US/CA, Music US/CA, UK Events, AU Events, Championships, Arts & Theater)
  - **Adaptive UI**: Only shows categories with 4+ events, fetches 50 events per region (200 total)
  - **Enhanced UX**: Relative date formatting, country flags, rewards badges, horizontal scrolling carousels
- **Maps and Location**: Geographic coordinate storage for venues and distance calculations
- **Email**: Prepared for confirmation and booking management emails

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack Query for frontend state management
- **TypeScript**: Full TypeScript support across frontend, backend, and shared schemas
- **Vite**: Modern build tool with React plugin and development server

### UI and Design System
- **Shadcn/ui**: Complete component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives (dialogs, forms, navigation, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library for the interface
- **Class Variance Authority**: Type-safe variant management for components

### Backend Infrastructure
- **Express.js**: Web framework for API development
- **Drizzle ORM**: Type-safe PostgreSQL ORM with migrations
- **Neon Database**: Serverless PostgreSQL hosting
- **Zod**: Schema validation for API inputs and forms

### Payment and External APIs
- **Stripe**: Payment processing with React Stripe.js components
- **Supabase**: Edge Functions for flight and hotel API integrations
- **Geographic Services**: Distance calculation utilities for venue proximity

### Development and Build Tools
- **ESBuild**: Fast bundling for production server builds
- **PostCSS**: CSS processing with Autoprefixer
- **Replit Plugins**: Development environment integration for cartographer and dev banner

### Optional Integrations (Prepared)
- **Event APIs**: Ticketmaster, Eventbrite for live event data
- **NowPayments**: Cryptocurrency payment processing
- **Email Services**: Transactional email for booking confirmations