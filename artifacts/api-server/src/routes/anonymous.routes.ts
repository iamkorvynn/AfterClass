import { Router, type Response } from "express";
import { db, anonymousPostsTable, anonymousCommentsTable, anonymousVotesTable } from "@workspace/db";
import { eq, and, sql, desc, ne } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { anonymizeRequest, type AnonymousRequest } from "../middlewares/strip-identity.middleware";
import { checkModeration, checkShadowBan } from "../middlewares/moderation.middleware";
import { 
  CreateAnonymousPostBody, 
  ListAnonymousPostsQueryParams, 
  DeleteAnonymousPostParams, 
  VoteAnonymousPostParams, 
  VoteAnonymousPostBody, 
  ListAnonymousCommentsParams, 
  CreateAnonymousCommentBody 
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

const ANIMALS = ["Panda", "Fox", "Axolotl", "Owl", "Koala", "Otter", "Badger", "Hedgehog", "Sloth", "Beaver", "Lemur", "Cheetah"];
const COLORS = ["Red", "Blue", "Green", "Orange", "Purple", "Pink", "Teal", "Gold", "Silver", "Amber", "Emerald", "Cyan"];

function getDeterministicAlias(userId: string, entityId: string): { name: string, avatar: string } {
  // Compute MD5 hash of userId + entityId to get deterministic index
  const hash = crypto.createHash("md5").update(`${userId}:${entityId}`).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  
  const color = COLORS[num % COLORS.length];
  const animal = ANIMALS[(num >> 4) % ANIMALS.length];
  
  return {
    name: `${color} ${animal}`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${hash}`
  };
}

// GET /anon/posts - Fetch anonymous confessions feed
router.get("/anon/posts", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const queryResult = ListAnonymousPostsQueryParams.safeParse(req.query);
    if (!queryResult.success) {
       res.status(400).json({ error: "Invalid query parameters" });
       return;
    }

    const { page } = queryResult.data;
    const limit = 20;
    const offset = (page - 1) * limit;
    const salt = process.env.ANON_SECRET_SALT || "fallback_salt";

    // Compute user's post owner hash for every post to check if they are the author
    // E.g. author signature = HMAC(user_id, post_id)
    // Drizzle query pulls posts, filtering out other users' shadow-banned posts.
    const posts = await db.select({
      id: anonymousPostsTable.id,
      content: anonymousPostsTable.content,
      aliasName: anonymousPostsTable.aliasName,
      aliasAvatar: anonymousPostsTable.aliasAvatar,
      campusDomain: anonymousPostsTable.campusDomain,
      status: anonymousPostsTable.status,
      isShadowBanned: anonymousPostsTable.isShadowBanned,
      ownerHash: anonymousPostsTable.ownerHash,
      createdAt: anonymousPostsTable.createdAt,
      upvoteCount: sql<number>`(SELECT COALESCE(SUM(CASE WHEN ${anonymousVotesTable.voteValue} = 1 THEN 1 ELSE 0 END), 0) FROM ${anonymousVotesTable} WHERE ${anonymousVotesTable.entityId} = ${anonymousPostsTable.id} AND ${anonymousVotesTable.entityType} = 'post')`.mapWith(Number),
      downvoteCount: sql<number>`(SELECT COALESCE(SUM(CASE WHEN ${anonymousVotesTable.voteValue} = -1 THEN 1 ELSE 0 END), 0) FROM ${anonymousVotesTable} WHERE ${anonymousVotesTable.entityId} = ${anonymousPostsTable.id} AND ${anonymousVotesTable.entityType} = 'post')`.mapWith(Number),
      commentCount: sql<number>`(SELECT COUNT(*) FROM ${anonymousCommentsTable} WHERE ${anonymousCommentsTable.postId} = ${anonymousPostsTable.id})`.mapWith(Number)
    })
    .from(anonymousPostsTable)
    .where(
      and(
        eq(anonymousPostsTable.campusDomain, req.user!.campusDomain),
        eq(anonymousPostsTable.status, "active")
      )
    )
    .orderBy(desc(anonymousPostsTable.createdAt))
    .limit(limit)
    .offset(offset);

    // Dynamic verification of votes and ownership
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      // Calculate vote hash for this post
      const hmacVote = crypto.createHmac("sha256", salt);
      hmacVote.update(`${userId}:${post.id}`);
      const voteHash = hmacVote.digest("hex");

      const voteRecord = await db.select()
        .from(anonymousVotesTable)
        .where(eq(anonymousVotesTable.voteHash, voteHash))
        .limit(1)
        .then(rows => rows[0]);

      // Calculate owner hash for this post
      const hmacOwner = crypto.createHmac("sha256", salt);
      hmacOwner.update(`${userId}:${post.id}`);
      const expectedOwnerHash = hmacOwner.digest("hex");
      
      const isAuthor = (post.ownerHash === expectedOwnerHash);

      return {
        id: post.id,
        content: post.content,
        aliasName: post.aliasName,
        aliasAvatar: post.aliasAvatar,
        campusDomain: post.campusDomain,
        upvoteCount: post.upvoteCount,
        downvoteCount: post.downvoteCount,
        commentCount: post.commentCount,
        userVote: voteRecord ? voteRecord.voteValue : null,
        isAuthor,
        isShadowBanned: post.isShadowBanned, // client can use this to show OP their post is pending/shadowed
        createdAt: post.createdAt
      };
    }));

    // Filter out shadow-banned posts if they aren't written by the current user
    const visiblePosts = enrichedPosts.filter(p => !p.isShadowBanned || p.isAuthor);

    res.status(200).json(visiblePosts);
  } catch (err) {
    logger.error({ err }, "Error in GET /anon/posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /anon/posts - Create confession (scrubs identity & pre-moderates)
router.post(
  "/anon/posts",
  verifyJwt,
  checkShadowBan,
  anonymizeRequest("postId"), // Creates req.anonContext containing ownerHash & domain, deletes req.user
  checkModeration,
  async (req: AnonymousRequest, res: Response) => {
    try {
      const anonContext = req.anonContext;
      if (!anonContext) {
         res.status(500).json({ error: "Context serialization failure" });
         return;
      }

      const bodyResult = CreateAnonymousPostBody.safeParse(req.body);
      if (!bodyResult.success) {
         res.status(400).json({ error: "Invalid content payload" });
         return;
      }

      const { content } = bodyResult.data;
      const isShadowBanned = req.body.isShadowBanned === true;

      // Assign deterministic alias for POST creator so it remains uniform if they post in their own thread.
      // E.g., we use ownerHash as seed to get a random animal
      const alias = getDeterministicAlias(anonContext.ownerHash, "post-creator");

      const newPosts = await db.insert(anonymousPostsTable)
        .values({
          content,
          aliasName: alias.name,
          aliasAvatar: alias.avatar,
          campusDomain: anonContext.campusDomain,
          ownerHash: anonContext.ownerHash,
          isShadowBanned,
          status: "active"
        })
        .returning();

      const post = newPosts[0];

      res.status(201).json({
        id: post.id,
        content: post.content,
        aliasName: post.aliasName,
        aliasAvatar: post.aliasAvatar,
        campusDomain: post.campusDomain,
        upvoteCount: 0,
        downvoteCount: 0,
        commentCount: 0,
        userVote: null,
        createdAt: post.createdAt
      });
    } catch (err) {
      logger.error({ err }, "Error in POST /anon/posts");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /anon/posts/:id - Delete confession (compares HMAC signatures)
router.delete(
  "/anon/posts/:id",
  verifyJwt,
  anonymizeRequest("id"), // Computes ownerHash based on user ID and target post ID
  async (req: AnonymousRequest, res: Response) => {
    try {
      const anonContext = req.anonContext;
      if (!anonContext) {
         res.status(500).json({ error: "Context serialization failure" });
         return;
      }

      const paramsResult = DeleteAnonymousPostParams.safeParse(req.params);
      if (!paramsResult.success) {
         res.status(400).json({ error: "Invalid post ID format" });
         return;
      }

      const { id } = paramsResult.data;

      // Delete ONLY if ownerHash matches
      const deletedRows = await db.delete(anonymousPostsTable)
        .where(
          and(
            eq(anonymousPostsTable.id, id),
            eq(anonymousPostsTable.ownerHash, anonContext.ownerHash)
          )
        )
        .returning();

      if (deletedRows.length === 0) {
         res.status(403).json({ error: "Unauthorized or post not found" });
         return;
      }

      // Cleanup related comments & votes
      await db.delete(anonymousCommentsTable).where(eq(anonymousCommentsTable.postId, id));
      await db.delete(anonymousVotesTable).where(eq(anonymousVotesTable.entityId, id));

      res.status(200).json({ message: "Anonymous post deleted successfully" });
    } catch (err) {
      logger.error({ err }, "Error in DELETE /anon/posts/:id");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /anon/posts/:id/vote - Upvote / Downvote confession
router.post(
  "/anon/posts/:id/vote",
  verifyJwt,
  anonymizeRequest("id"), // Computes voteHash based on user ID and post ID
  async (req: AnonymousRequest, res: Response) => {
    try {
      const anonContext = req.anonContext;
      if (!anonContext) {
         res.status(500).json({ error: "Context serialization failure" });
         return;
      }

      const paramsResult = VoteAnonymousPostParams.safeParse(req.params);
      const bodyResult = VoteAnonymousPostBody.safeParse(req.body);

      if (!paramsResult.success || !bodyResult.success) {
         res.status(400).json({ error: "Invalid request inputs" });
         return;
      }

      const { id } = paramsResult.data;
      const { value } = bodyResult.data; // 1 or -1

      // check if post exists
      const post = await db.select()
        .from(anonymousPostsTable)
        .where(eq(anonymousPostsTable.id, id))
        .limit(1)
        .then(rows => rows[0]);

      if (!post) {
         res.status(404).json({ error: "Post not found" });
         return;
      }

      // Check if vote already exists (voteHash is composite PK)
      const existingVote = await db.select()
        .from(anonymousVotesTable)
        .where(eq(anonymousVotesTable.voteHash, anonContext.ownerHash)) // We reuse ownerHash calculation as voteHash
        .limit(1)
        .then(rows => rows[0]);

      if (existingVote) {
        if (existingVote.voteValue === value) {
          // Double tap same vote -> removes vote
          await db.delete(anonymousVotesTable).where(eq(anonymousVotesTable.voteHash, anonContext.ownerHash));
        } else {
          // Swapping vote
          await db.update(anonymousVotesTable)
            .set({ voteValue: value })
            .where(eq(anonymousVotesTable.voteHash, anonContext.ownerHash));
        }
      } else {
        // Insert new vote
        await db.insert(anonymousVotesTable)
          .values({
            voteHash: anonContext.ownerHash,
            entityId: id,
            entityType: "post",
            voteValue: value
          });
      }

      // Recalculate upvote & downvote counts
      const upvotes = await db.select({ count: sql<number>`COUNT(*)` })
        .from(anonymousVotesTable)
        .where(and(eq(anonymousVotesTable.entityId, id), eq(anonymousVotesTable.voteValue, 1)))
        .then(rows => Number(rows[0]?.count || 0));

      const downvotes = await db.select({ count: sql<number>`COUNT(*)` })
        .from(anonymousVotesTable)
        .where(and(eq(anonymousVotesTable.entityId, id), eq(anonymousVotesTable.voteValue, -1)))
        .then(rows => Number(rows[0]?.count || 0));

      // Get current user vote
      const userVoteRecord = await db.select()
        .from(anonymousVotesTable)
        .where(eq(anonymousVotesTable.voteHash, anonContext.ownerHash))
        .limit(1)
        .then(rows => rows[0]);

      res.status(200).json({
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        userVote: userVoteRecord ? userVoteRecord.voteValue : 0
      });
    } catch (err) {
      logger.error({ err }, "Error in POST /anon/posts/:id/vote");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /anon/posts/:id/comments - Query thread comments
router.get("/anon/posts/:id/comments", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramsResult = ListAnonymousCommentsParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid post ID format" });
       return;
    }

    const { id: postId } = paramsResult.data;

    const comments = await db.select()
      .from(anonymousCommentsTable)
      .where(
        and(
          eq(anonymousCommentsTable.postId, postId),
          eq(anonymousCommentsTable.isShadowBanned, false) // Filters out shadow banned comments by default
        )
      )
      .orderBy(anonymousCommentsTable.createdAt);

    res.status(200).json(comments);
  } catch (err) {
    logger.error({ err }, "Error in GET /anon/posts/:id/comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /anon/posts/:id/comments - Create anonymous comment
router.post(
  "/anon/posts/:id/comments",
  verifyJwt,
  checkShadowBan,
  anonymizeRequest("id"), // Computes ownerHash based on user ID and post ID
  checkModeration,
  async (req: AnonymousRequest, res: Response) => {
    try {
      const anonContext = req.anonContext;
      if (!anonContext) {
         res.status(500).json({ error: "Context serialization failure" });
         return;
      }

      const paramsResult = ListAnonymousCommentsParams.safeParse(req.params);
      const bodyResult = CreateAnonymousCommentBody.safeParse(req.body);

      if (!paramsResult.success || !bodyResult.success) {
         res.status(400).json({ error: "Invalid request payload" });
         return;
      }

      const { id: postId } = paramsResult.data;
      const { content, parentId } = bodyResult.data;
      const isShadowBanned = req.body.isShadowBanned === true;

      // Assign deterministic alias consistent within this thread (hashed from ownerHash + postId)
      const alias = getDeterministicAlias(anonContext.ownerHash, postId);

      const newComments = await db.insert(anonymousCommentsTable)
        .values({
          postId,
          content,
          parentId,
          aliasName: alias.name,
          aliasAvatar: alias.avatar,
          ownerHash: anonContext.ownerHash,
          isShadowBanned
        })
        .returning();

      const comment = newComments[0];

      res.status(201).json({
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        parentId: comment.parentId,
        aliasName: comment.aliasName,
        aliasAvatar: comment.aliasAvatar,
        createdAt: comment.createdAt
      });
    } catch (err) {
      logger.error({ err }, "Error in POST /anon/posts/:id/comments");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
