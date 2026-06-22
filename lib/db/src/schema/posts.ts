import { pgTable, uuid, text, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { communitiesTable } from "./communities";

export const postsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  communityId: uuid("community_id").references(() => communitiesTable.id), // null if general campus feed
  campusDomain: varchar("campus_domain", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const commentsTable = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => postsTable.id).notNull(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"), // self-referencing hierarchy
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const likesTable = pgTable("likes", {
  postId: uuid("post_id").references(() => postsTable.id).notNull(),
  userId: uuid("user_id").references(() => usersTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
}));

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
export type Like = typeof likesTable.$inferSelect;
export type InsertLike = typeof likesTable.$inferInsert;
