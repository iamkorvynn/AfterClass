import { pgTable, uuid, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const anonymousPostsTable = pgTable("anonymous_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  aliasName: varchar("alias_name", { length: 100 }).notNull(), // e.g., 'Anonymous Axolotl'
  aliasAvatar: varchar("alias_avatar", { length: 100 }).notNull(),
  campusDomain: varchar("campus_domain", { length: 100 }).notNull(),
  // HMAC_SHA256(user_id, post_id + secret_salt)
  // Ensures creator validation without keeping trace of the user ID.
  ownerHash: varchar("owner_hash", { length: 64 }).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'hidden'
  isShadowBanned: boolean("is_shadow_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const anonymousCommentsTable = pgTable("anonymous_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => anonymousPostsTable.id).notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"), // self-reference for replies
  aliasName: varchar("alias_name", { length: 100 }).notNull(),
  aliasAvatar: varchar("alias_avatar", { length: 100 }).notNull(),
  ownerHash: varchar("owner_hash", { length: 64 }).notNull(), // HMAC_SHA256(user_id, comment_id + secret_salt)
  isShadowBanned: boolean("is_shadow_banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const anonymousVotesTable = pgTable("anonymous_votes", {
  // HMAC_SHA256(user_id, entity_id + secret_salt)
  // Composite PK / Unique Key representing user+post combination.
  voteHash: varchar("vote_hash", { length: 64 }).primaryKey(),
  entityId: uuid("entity_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'post' | 'comment'
  voteValue: integer("vote_value").notNull(), // 1 (upvote) or -1 (downvote)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnonymousPost = typeof anonymousPostsTable.$inferSelect;
export type InsertAnonymousPost = typeof anonymousPostsTable.$inferInsert;
export type AnonymousComment = typeof anonymousCommentsTable.$inferSelect;
export type InsertAnonymousComment = typeof anonymousCommentsTable.$inferInsert;
export type AnonymousVote = typeof anonymousVotesTable.$inferSelect;
export type InsertAnonymousVote = typeof anonymousVotesTable.$inferInsert;
