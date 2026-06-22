import { pgTable, uuid, varchar, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const communitiesTable = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  campusDomain: varchar("campus_domain", { length: 100 }).notNull(),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const communityMembersTable = pgTable("community_members", {
  communityId: uuid("community_id").references(() => communitiesTable.id).notNull(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(), // 'admin' | 'moderator' | 'member'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.communityId, table.userId] }),
}));

export type Community = typeof communitiesTable.$inferSelect;
export type InsertCommunity = typeof communitiesTable.$inferInsert;
export type CommunityMember = typeof communityMembersTable.$inferSelect;
export type InsertCommunityMember = typeof communityMembersTable.$inferInsert;
