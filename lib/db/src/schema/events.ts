import { pgTable, uuid, varchar, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { communitiesTable } from "./communities";

export const eventsTable = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  communityId: uuid("community_id").references(() => communitiesTable.id), // Nullable if general event
  createdBy: uuid("created_by").references(() => usersTable.id).notNull(),
  campusDomain: varchar("campus_domain", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const eventRsvpsTable = pgTable("event_rsvps", {
  eventId: uuid("event_id").references(() => eventsTable.id).notNull(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  status: varchar("status", { length: 50 }).default("attending").notNull(), // 'attending' | 'maybe' | 'declined'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.eventId, table.userId] }),
}));

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = typeof eventsTable.$inferInsert;
export type EventRsvp = typeof eventRsvpsTable.$inferSelect;
export type InsertEventRsvp = typeof eventRsvpsTable.$inferInsert;
