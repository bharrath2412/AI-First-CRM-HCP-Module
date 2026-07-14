import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  date,
  time,
} from "drizzle-orm/pg-core";

// Known HCPs in the system
export const hcps = pgTable("hcps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product materials catalog
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // brochure, sample, flyer, etc.
  productName: varchar("product_name", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Logged interactions
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  hcpName: varchar("hcp_name", { length: 255 }).notNull(),
  interactionType: varchar("interaction_type", { length: 100 }).notNull().default("Meeting"),
  interactionDate: date("interaction_date").notNull(),
  interactionTime: time("interaction_time"),
  attendees: text("attendees"),
  topicsDiscussed: text("topics_discussed"),
  materialsShared: text("materials_shared"),
  sentiment: varchar("sentiment", { length: 20 }),
  outcomes: text("outcomes"),
  followUpActions: text("follow_up_actions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follow-up actions
export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  interactionId: serial("interaction_id"),
  action: text("action").notNull(),
  dueDate: date("due_date"),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});
