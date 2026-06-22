import { Router, type Response } from "express";
import { db, postsTable, commentsTable, likesTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { 
  CreatePostBody, 
  ListPostsQueryParams, 
  DeletePostParams, 
  ToggleLikePostParams, 
  ListCommentsParams, 
  CreateCommentBody 
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

// GET /posts - Fetch verified campus posts feed
router.get("/posts", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const queryResult = ListPostsQueryParams.safeParse(req.query);
    if (!queryResult.success) {
       res.status(400).json({ error: "Invalid query parameters" });
       return;
    }

    const { communityId, page } = queryResult.data;
    const limit = 20;
    const offset = (page - 1) * limit;

    const posts = await db.select({
      id: postsTable.id,
      userId: postsTable.userId,
      fullName: usersTable.fullName,
      profilePicture: usersTable.profilePicture,
      content: postsTable.content,
      imageUrl: postsTable.imageUrl,
      communityId: postsTable.communityId,
      campusDomain: postsTable.campusDomain,
      createdAt: postsTable.createdAt,
      likeCount: sql<number>`(SELECT COUNT(*) FROM ${likesTable} WHERE ${likesTable.postId} = ${postsTable.id})`.mapWith(Number),
      commentCount: sql<number>`(SELECT COUNT(*) FROM ${commentsTable} WHERE ${commentsTable.postId} = ${postsTable.id})`.mapWith(Number),
      isLiked: sql<boolean>`EXISTS (SELECT 1 FROM ${likesTable} WHERE ${likesTable.postId} = ${postsTable.id} AND ${likesTable.userId} = ${userId})`
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .where(
      and(
        eq(postsTable.campusDomain, req.user!.campusDomain),
        communityId ? eq(postsTable.communityId, communityId) : undefined
      )
    )
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

    res.status(200).json(posts);
  } catch (err) {
    logger.error({ err }, "Error in GET /posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /posts - Create post on verified campus feed
router.post("/posts", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = CreatePostBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { content, imageUrl, communityId } = bodyResult.data;

    const newPosts = await db.insert(postsTable)
      .values({
        userId,
        content,
        imageUrl,
        communityId,
        campusDomain: req.user!.campusDomain
      })
      .returning();

    const post = newPosts[0];

    // Fetch user details for response formatting
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    res.status(201).json({
      id: post.id,
      userId: post.userId,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      content: post.content,
      imageUrl: post.imageUrl,
      communityId: post.communityId,
      campusDomain: post.campusDomain,
      createdAt: post.createdAt,
      commentCount: 0,
      likeCount: 0,
      isLiked: false
    });
  } catch (err) {
    logger.error({ err }, "Error in POST /posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /posts/:id - Delete verified post
router.delete("/posts/:id", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = DeletePostParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid post ID format" });
       return;
    }

    const { id } = paramsResult.data;

    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!post) {
       res.status(404).json({ error: "Post not found" });
       return;
    }

    if (post.userId !== userId) {
       res.status(403).json({ error: "You can only delete your own posts" });
       return;
    }

    // Clean up likes and comments first
    await db.delete(likesTable).where(eq(likesTable.postId, id));
    await db.delete(commentsTable).where(eq(commentsTable.postId, id));
    await db.delete(postsTable).where(eq(postsTable.id, id));

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Error in DELETE /posts/:id");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /posts/:id/like - Like or unlike a verified post
router.post("/posts/:id/like", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = ToggleLikePostParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid post ID format" });
       return;
    }

    const { id } = paramsResult.data;

    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!post) {
       res.status(404).json({ error: "Post not found" });
       return;
    }

    // Check if liked already
    const existingLike = await db.select()
      .from(likesTable)
      .where(and(eq(likesTable.postId, id), eq(likesTable.userId, userId)))
      .limit(1)
      .then(rows => rows[0]);

    let liked = false;
    if (existingLike) {
      await db.delete(likesTable).where(and(eq(likesTable.postId, id), eq(likesTable.userId, userId)));
    } else {
      await db.insert(likesTable).values({ postId: id, userId });
      liked = true;
    }

    res.status(200).json({ liked });
  } catch (err) {
    logger.error({ err }, "Error in POST /posts/:id/like");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /posts/:id/comments - Query comments for a verified post
router.get("/posts/:id/comments", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramsResult = ListCommentsParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid post ID format" });
       return;
    }

    const { id } = paramsResult.data;

    const comments = await db.select({
      id: commentsTable.id,
      postId: commentsTable.postId,
      userId: commentsTable.userId,
      fullName: usersTable.fullName,
      profilePicture: usersTable.profilePicture,
      content: commentsTable.content,
      parentId: commentsTable.parentId,
      createdAt: commentsTable.createdAt
    })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.postId, id))
    .orderBy(commentsTable.createdAt);

    res.status(200).json(comments);
  } catch (err) {
    logger.error({ err }, "Error in GET /posts/:id/comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /posts/:id/comments - Comment on a verified post
router.post("/posts/:id/comments", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = ListCommentsParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid post ID format" });
       return;
    }

    const { id: postId } = paramsResult.data;

    const bodyResult = CreateCommentBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { content, parentId } = bodyResult.data;

    const newComments = await db.insert(commentsTable)
      .values({
        postId,
        userId,
        content,
        parentId
      })
      .returning();

    const comment = newComments[0];

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    res.status(201).json({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt
    });
  } catch (err) {
    logger.error({ err }, "Error in POST /posts/:id/comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
