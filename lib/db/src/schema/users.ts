import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  major: varchar("major", { length: 100 }).notNull(),
  graduationYear: integer("graduation_year").notNull(),
  profilePicture: varchar("profile_picture", { length: 500 }),
  bio: varchar("bio", { length: 500 }),
  campusDomain: varchar("campus_domain", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
