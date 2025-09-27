import { 
  type User, 
  type InsertUser, 
  type Event, 
  type InsertEvent, 
  type Booking, 
  type InsertBooking, 
  type BookingItem, 
  type InsertBookingItem,
  type SavedItem,
  type InsertSavedItem
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Events
  getEvents(filters?: { 
    city?: string; 
    category?: string; 
    startDate?: Date; 
    endDate?: Date; 
    limit?: number; 
  }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByEmail(email: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking>;
  
  // Booking Items
  getBookingItems(bookingId: string): Promise<BookingItem[]>;
  createBookingItem(item: InsertBookingItem): Promise<BookingItem>;
  
  // Saved Items
  getSavedItems(userId?: string, guestEmail?: string): Promise<SavedItem[]>;
  createSavedItem(item: InsertSavedItem): Promise<SavedItem>;
  deleteSavedItem(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: Map<string, Event> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private bookingItems: Map<string, BookingItem> = new Map();
  private savedItems: Map<string, SavedItem> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some example events
    const sampleEvents: Event[] = [
      {
        id: "event-1",
        title: "Summer Beats Festival",
        description: "Experience 3 days of incredible music in the heart of New York City",
        category: "Music Festival",
        venue: "Central Park Great Lawn",
        address: "Central Park, New York",
        city: "New York",
        country: "USA",
        latitude: "40.7829",
        longitude: "-73.9654",
        startDate: new Date("2024-07-15"),
        endDate: new Date("2024-07-17"),
        imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        priceFrom: "89.00",
        rating: "4.8",
        reviewCount: 2340,
        maxAttendees: 50000,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "event-2",
        title: "NBA Finals Game 7",
        description: "Witness basketball history in the making",
        category: "Sports",
        venue: "Madison Square Garden",
        address: "4 Pennsylvania Plaza, New York",
        city: "New York",
        country: "USA",
        latitude: "40.7505",
        longitude: "-73.9934",
        startDate: new Date("2024-08-20"),
        endDate: new Date("2024-08-20"),
        imageUrl: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        priceFrom: "299.00",
        rating: "4.9",
        reviewCount: 1856,
        maxAttendees: 20000,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "event-3",
        title: "TechCon 2024",
        description: "The premier technology conference featuring industry leaders",
        category: "Conference",
        venue: "Moscone Center",
        address: "747 Howard St, San Francisco",
        city: "San Francisco",
        country: "USA",
        latitude: "37.7840",
        longitude: "-122.4014",
        startDate: new Date("2024-09-05"),
        endDate: new Date("2024-09-07"),
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        priceFrom: "199.00",
        rating: "4.7",
        reviewCount: 892,
        maxAttendees: 15000,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    sampleEvents.forEach(event => {
      this.events.set(event.id, event);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      stripeCustomerId: null,
    };
    this.users.set(id, user);
    return user;
  }

  // Events
  async getEvents(filters?: { 
    city?: string; 
    category?: string; 
    startDate?: Date; 
    endDate?: Date; 
    limit?: number; 
  }): Promise<Event[]> {
    let events = Array.from(this.events.values()).filter(event => event.isActive);
    
    if (filters?.city) {
      events = events.filter(event => 
        event.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    
    if (filters?.category) {
      events = events.filter(event => 
        event.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters?.startDate) {
      events = events.filter(event => 
        new Date(event.startDate) >= filters.startDate!
      );
    }
    
    if (filters?.endDate) {
      events = events.filter(event => 
        new Date(event.endDate) <= filters.endDate!
      );
    }
    
    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }
    
    return events.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
      isActive: true,
      reviewCount: 0,
    };
    this.events.set(id, event);
    return event;
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.guestEmail === email
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    
    const updatedBooking: Booking = {
      ...booking,
      status,
      stripePaymentIntentId: paymentIntentId || booking.stripePaymentIntentId,
      updatedAt: new Date(),
    };
    
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Booking Items
  async getBookingItems(bookingId: string): Promise<BookingItem[]> {
    return Array.from(this.bookingItems.values()).filter(
      item => item.bookingId === bookingId
    );
  }

  async createBookingItem(insertItem: InsertBookingItem): Promise<BookingItem> {
    const id = randomUUID();
    const item: BookingItem = {
      ...insertItem,
      id,
    };
    this.bookingItems.set(id, item);
    return item;
  }

  // Saved Items
  async getSavedItems(userId?: string, guestEmail?: string): Promise<SavedItem[]> {
    return Array.from(this.savedItems.values()).filter(item => 
      (userId && item.userId === userId) || 
      (guestEmail && item.guestEmail === guestEmail)
    );
  }

  async createSavedItem(insertItem: InsertSavedItem): Promise<SavedItem> {
    const id = randomUUID();
    const item: SavedItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.savedItems.set(id, item);
    return item;
  }

  async deleteSavedItem(id: string): Promise<void> {
    this.savedItems.delete(id);
  }
}

export const storage = new MemStorage();
