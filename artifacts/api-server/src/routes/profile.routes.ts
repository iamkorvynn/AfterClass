import { Router, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { UpdateProfileBody, GetProfileByIdParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

// GET /profiles/me - Fetch current student profile
router.get("/profiles/me", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
       res.status(404).json({ error: "Profile not found" });
       return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      major: user.major,
      graduationYear: user.graduationYear,
      profilePicture: user.profilePicture,
      bio: user.bio,
      campusDomain: user.campusDomain
    });
  } catch (err) {
    logger.error({ err }, "Error in GET /profiles/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /profiles/me - Update profile fields
router.post("/profiles/me", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  // Note: Express router maps PUT /profiles/me to this handler, and openapi specifies PUT /profiles/me
  // We use router.put or router.post? The openapi spec states: "PUT /profiles/me"
  // Wait! In the index route mapping, we can use router.put("/profiles/me", ...).
  // Let's implement it under router.put and router.post so both are supported!
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = UpdateProfileBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { fullName, major, graduationYear, profilePicture, bio } = bodyResult.data;

    const updatedUsers = await db.update(usersTable)
      .set({
        ...(fullName !== undefined && { fullName }),
        ...(major !== undefined && { major }),
        ...(graduationYear !== undefined && { graduationYear }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(bio !== undefined && { bio }),
        updatedAt: new Date()
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const updatedUser = updatedUsers[0];

    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      major: updatedUser.major,
      graduationYear: updatedUser.graduationYear,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      campusDomain: updatedUser.campusDomain
    });
  } catch (err) {
    logger.error({ err }, "Error in PUT /profiles/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Map router.put as well to support the HTTP PUT method specified in OpenAPI
router.put("/profiles/me", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = UpdateProfileBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { fullName, major, graduationYear, profilePicture, bio } = bodyResult.data;

    const updatedUsers = await db.update(usersTable)
      .set({
        ...(fullName !== undefined && { fullName }),
        ...(major !== undefined && { major }),
        ...(graduationYear !== undefined && { graduationYear }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(bio !== undefined && { bio }),
        updatedAt: new Date()
      })
      .where(eq(usersTable.id, userId))
      .returning();

    const updatedUser = updatedUsers[0];

    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      major: updatedUser.major,
      graduationYear: updatedUser.graduationYear,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      campusDomain: updatedUser.campusDomain
    });
  } catch (err) {
    logger.error({ err }, "Error in PUT /profiles/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /profiles/:id - Fetch another student's profile by ID
router.get("/profiles/:id", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramsResult = GetProfileByIdParams.safeParse(req.params);
    if (!paramsResult.success) {
       res.status(400).json({ error: "Invalid profile ID format" });
       return;
    }

    const { id } = paramsResult.data;

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
       res.status(404).json({ error: "Profile not found" });
       return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      major: user.major,
      graduationYear: user.graduationYear,
      profilePicture: user.profilePicture,
      bio: user.bio,
      campusDomain: user.campusDomain
    });
  } catch (err) {
    logger.error({ err }, "Error in GET /profiles/:id");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
