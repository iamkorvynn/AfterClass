import type { Response, NextFunction } from "express";
import type { AnonymousRequest } from "./strip-identity.middleware";
import { db, shadowBansTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Basic checks for Hate speech, Phone numbers, Social media tags (@), PII
function cleanTextContent(text: string): boolean {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const handleRegex = /@[a-zA-Z0-9_]+/g;
  const hateSpeechWords = ["hateword1", "hateword2"];

  if (phoneRegex.test(text) || handleRegex.test(text)) {
    return false;
  }
  
  const textLower = text.toLowerCase();
  for (const word of hateSpeechWords) {
    if (textLower.includes(word)) {
      return false;
    }
  }
  return true;
}

export async function checkModeration(req: AnonymousRequest, res: Response, next: NextFunction) {
  const content = req.body.content;
  if (content && !cleanTextContent(content)) {
    res.status(400).json({ error: "Content flagged by automated AI moderation filters" });
    return;
  }
  next();
}

export async function checkShadowBan(req: AnonymousRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    return next();
  }

  try {
    const ban = await db.select()
      .from(shadowBansTable)
      .where(eq(shadowBansTable.userId, userId))
      .limit(1);

    if (ban.length > 0) {
      const banDetails = ban[0];
      if (!banDetails.expiresAt || banDetails.expiresAt > new Date()) {
        // Silently flag as shadow-banned in request body
        req.body.isShadowBanned = true;
      }
    }
  } catch (err) {
    // Fail-safe: log error internally and proceed
  }
  next();
}
