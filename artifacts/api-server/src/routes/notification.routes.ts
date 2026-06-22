import { Router, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { MarkNotificationReadParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

// GET /notifications - Fetch user's notification history
router.get("/notifications", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt));

    res.status(200).json(notifications);
  } catch (err) {
    logger.error({ err }, "Error in GET /notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /notifications/:id/read - Mark notification as read
router.post("/notifications/:id/read", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = MarkNotificationReadParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid notification ID format" });
       return;
    }

    const { id } = paramsResult.data;

    // Update notification readAt timestamp if owned by requesting user
    const updated = await db.update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, userId)
        )
      )
      .returning();

    if (updated.length === 0) {
       res.status(404).json({ error: "Notification not found or access denied" });
       return;
    }

    res.status(200).json({ message: "Notification marked read successfully" });
  } catch (err) {
    logger.error({ err }, "Error in POST /notifications/:id/read");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
