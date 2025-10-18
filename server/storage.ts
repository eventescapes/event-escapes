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
  type InsertSavedItem,
  type TicketmasterEvent,
  type InsertTicketmasterEvent,
  users,
  events,
  bookings,
  bookingItems,
  savedItems,
  ticketmasterEvents
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, gte, lte, like, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = neon(connectionString);
const db = drizzle(client);

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
  
  // Ticketmaster Events
  getTicketmasterEvents(filters?: {
    country?: string;
    segment?: string;
    isMajorEvent?: boolean;
    limit?: number;
  }): Promise<TicketmasterEvent[]>;
  getTicketmasterEvent(id: string): Promise<TicketmasterEvent | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if events already exist
      const existingEvents = await db.select().from(events).limit(1);
      if (existingEvents.length > 0) {
        console.log("Database already seeded with events");
        return;
      }

      // Seed some example events
      const sampleEvents = [
        {
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
        },
        {
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
        },
        {
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
        },
      ];

      await db.insert(events).values(sampleEvents);
      console.log("Database seeded with sample events");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Events
  async getEvents(filters?: { 
    city?: string; 
    category?: string; 
    startDate?: Date; 
    endDate?: Date; 
    limit?: number; 
  }): Promise<Event[]> {
    const conditions = [eq(events.isActive, true)];
    
    if (filters?.city) {
      conditions.push(like(events.city, `%${filters.city}%`));
    }
    
    if (filters?.category) {
      conditions.push(like(events.category, `%${filters.category}%`));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(events.startDate, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(events.endDate, filters.endDate));
    }
    
    let query = db.select().from(events).where(and(...conditions)).orderBy(events.startDate);
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(insertEvent).returning();
    return result[0];
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.guestEmail, email)).orderBy(desc(bookings.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(insertBooking).returning();
    return result[0];
  }

  async updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (paymentIntentId) {
      updateData.stripePaymentIntentId = paymentIntentId;
    }
    
    const result = await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Booking not found");
    }
    
    return result[0];
  }

  // Booking Items
  async getBookingItems(bookingId: string): Promise<BookingItem[]> {
    return await db.select().from(bookingItems).where(eq(bookingItems.bookingId, bookingId));
  }

  async createBookingItem(insertItem: InsertBookingItem): Promise<BookingItem> {
    const result = await db.insert(bookingItems).values(insertItem).returning();
    return result[0];
  }

  // Saved Items
  async getSavedItems(userId?: string, guestEmail?: string): Promise<SavedItem[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(savedItems.userId, userId));
    }
    
    if (guestEmail) {
      conditions.push(eq(savedItems.guestEmail, guestEmail));
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    return await db.select().from(savedItems).where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  async createSavedItem(insertItem: InsertSavedItem): Promise<SavedItem> {
    const result = await db.insert(savedItems).values(insertItem).returning();
    return result[0];
  }

  async deleteSavedItem(id: string): Promise<void> {
    await db.delete(savedItems).where(eq(savedItems.id, id));
  }

  // Ticketmaster Events
  async getTicketmasterEvents(filters?: {
    country?: string;
    segment?: string;
    isMajorEvent?: boolean;
    limit?: number;
  }): Promise<TicketmasterEvent[]> {
    const conditions = [];
    
    if (filters?.country) {
      conditions.push(eq(ticketmasterEvents.venue_country_code, filters.country));
    }
    
    if (filters?.segment) {
      conditions.push(eq(ticketmasterEvents.segment, filters.segment));
    }
    
    if (filters?.isMajorEvent !== undefined) {
      conditions.push(eq(ticketmasterEvents.is_major_event, filters.isMajorEvent));
    }
    
    // Filter for future events only
    conditions.push(gte(ticketmasterEvents.event_start_date, new Date()));
    
    let query = db.select().from(ticketmasterEvents);
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    
    query = query.orderBy(ticketmasterEvents.event_start_date) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async getTicketmasterEvent(id: string): Promise<TicketmasterEvent | undefined> {
    const result = await db.select().from(ticketmasterEvents).where(eq(ticketmasterEvents.id, id)).limit(1);
    return result[0];
  }
}

export const storage = new DatabaseStorage();
