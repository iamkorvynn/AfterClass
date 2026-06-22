import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const reportsTable = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Hash to prevent duplicate reports by the same user: HMAC_SHA256(user_id, entity_id + salt)
  reporterHash: varchar("reporter_hash", { length: 64 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'post' | 'comment' | 'anon_post' | 'anon_comment' | 'chat'
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shadowBansTable = pgTable("shadow_bans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id).notNull().unique(),
  reason: text("reason").notNull(),
  bannedBy: uuid("banned_by").references(() => usersTable.id).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Report = typeof reportsTable.$inferSelect;
export type InsertReport = typeof reportsTable.$inferInsert;
export type ShadowBan = typeof shadowBansTable.$inferSelect;
export type InsertShadowBan = typeof shadowBansTable.$inferInsert;
