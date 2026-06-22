import { Router, type Response } from "express";
import { db, communitiesTable, communityMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateCommunityBody, JoinCommunityParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

// GET /communities - List campus communities
router.get("/communities", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const communities = await db.select()
      .from(communitiesTable)
      .where(eq(communitiesTable.campusDomain, req.user!.campusDomain));

    res.status(200).json(communities);
  } catch (err) {
    logger.error({ err }, "Error in GET /communities");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /communities - Build a new campus club/community
router.post("/communities", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = CreateCommunityBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { name, slug, description } = bodyResult.data;

    // Check slug uniqueness
    const existing = await db.select()
      .from(communitiesTable)
      .where(eq(communitiesTable.slug, slug.toLowerCase()))
      .limit(1)
      .then(rows => rows[0]);

    if (existing) {
       res.status(400).json({ error: "A community with this slug already exists" });
       return;
    }

    const newCommunities = await db.insert(communitiesTable)
      .values({
        name,
        slug: slug.toLowerCase(),
        description,
        campusDomain: req.user!.campusDomain,
        createdBy: userId
      })
      .returning();

    const community = newCommunities[0];

    // Automatically join the creator as administrator
    await db.insert(communityMembersTable)
      .values({
        communityId: community.id,
        userId,
        role: "admin"
      });

    res.status(201).json(community);
  } catch (err) {
    logger.error({ err }, "Error in POST /communities");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /communities/:id/join - Join or leave a campus community
router.post("/communities/:id/join", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = JoinCommunityParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid community ID format" });
       return;
    }

    const { id: communityId } = paramsResult.data;

    // check if community exists
    const community = await db.select()
      .from(communitiesTable)
      .where(eq(communitiesTable.id, communityId))
      .limit(1)
      .then(rows => rows[0]);

    if (!community) {
       res.status(404).json({ error: "Community not found" });
       return;
    }

    // Check membership
    const member = await db.select()
      .from(communityMembersTable)
      .where(
        and(
          eq(communityMembersTable.communityId, communityId),
          eq(communityMembersTable.userId, userId)
        )
      )
      .limit(1)
      .then(rows => rows[0]);

    let joined = false;
    if (member) {
      if (member.role === "admin") {
         res.status(400).json({ error: "Community creator/admin cannot leave the community" });
         return;
      }
      await db.delete(communityMembersTable)
        .where(
          and(
            eq(communityMembersTable.communityId, communityId),
            eq(communityMembersTable.userId, userId)
          )
        );
    } else {
      await db.insert(communityMembersTable)
        .values({
          communityId,
          userId,
          role: "member"
        });
      joined = true;
    }

    res.status(200).json({ joined });
  } catch (err) {
    logger.error({ err }, "Error in POST /communities/:id/join");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
