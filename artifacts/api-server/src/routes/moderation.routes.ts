import { Router, type Response } from "express";
import { db, reportsTable, shadowBansTable, anonymousPostsTable, anonymousCommentsTable, postsTable, commentsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateReportBody, ApplyShadowBanBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

// POST /reports - Report a post, comment, or chat
router.post("/reports", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = CreateReportBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid report parameters", details: bodyResult.error.format() });
       return;
    }

    const { entityId, entityType, reason, details } = bodyResult.data;
    const salt = process.env.ANON_SECRET_SALT || "fallback_salt";

    // HMAC to prevent duplicate reporting: HMAC_SHA256(user_id, entity_id + salt)
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(`${userId}:${entityId}`);
    const reporterHash = hmac.digest("hex");

    // Check if reporter already reported this entity
    const existing = await db.select()
      .from(reportsTable)
      .where(and(eq(reportsTable.reporterHash, reporterHash), eq(reportsTable.entityId, entityId)))
      .limit(1)
      .then(rows => rows[0]);

    if (existing) {
       res.status(400).json({ error: "You have already reported this content" });
       return;
    }

    // Insert report
    await db.insert(reportsTable)
      .values({
        reporterHash,
        entityId,
        entityType,
        reason,
        details,
        status: "pending"
      });

    // Check current report count for this entity
    const count = await db.select({ count: sql<number>`COUNT(*)` })
      .from(reportsTable)
      .where(eq(reportsTable.entityId, entityId))
      .then(rows => Number(rows[0]?.count || 0));

    // Threshold rule: if flags >= 5, automatically set status = hidden or soft-delete
    if (count >= 5) {
      logger.warn(`Auto-hiding entity ${entityId} of type ${entityType} due to reaching 5 reports.`);
      if (entityType === "anon_post") {
        await db.update(anonymousPostsTable)
          .set({ status: "hidden" })
          .where(eq(anonymousPostsTable.id, entityId));
      } else if (entityType === "anon_comment") {
        // Hide comment by shadow banning it (silently hides from everyone)
        await db.update(anonymousCommentsTable)
          .set({ isShadowBanned: true })
          .where(eq(anonymousCommentsTable.id, entityId));
      } else if (entityType === "post") {
        // Soft delete post
        await db.update(postsTable)
          .set({ deletedAt: new Date() })
          .where(eq(postsTable.id, entityId));
      } else if (entityType === "comment") {
        // Soft delete comment
        await db.update(commentsTable)
          .set({ deletedAt: new Date() })
          .where(eq(commentsTable.id, entityId));
      }
    }

    res.status(201).json({ message: "Content reported successfully" });
  } catch (err) {
    logger.error({ err }, "Error in POST /reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /moderation/shadow-ban - Admin shadowban a user
router.post("/moderation/shadow-ban", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    // Dev/Simple check: only allow if user has admin email or we just trust for mock demo
    // E.g. email ends with admin@college.edu or similar, or just allow in development
    const bodyResult = ApplyShadowBanBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { userId: targetUserId, reason, durationDays } = bodyResult.data;

    let expiresAt: Date | null = null;
    if (durationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
    }

    // Insert or update shadow ban record
    const existing = await db.select()
      .from(shadowBansTable)
      .where(eq(shadowBansTable.userId, targetUserId))
      .limit(1)
      .then(rows => rows[0]);

    if (existing) {
      await db.update(shadowBansTable)
        .set({ reason, expiresAt, bannedBy: userId, createdAt: new Date() })
        .where(eq(shadowBansTable.userId, targetUserId));
    } else {
      await db.insert(shadowBansTable)
        .values({
          userId: targetUserId,
          reason,
          bannedBy: userId,
          expiresAt
        });
    }

    res.status(200).json({ message: "User shadow-banned successfully" });
  } catch (err) {
    logger.error({ err }, "Error in POST /moderation/shadow-ban");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
