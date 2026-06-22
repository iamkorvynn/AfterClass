import { Router, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { RegisterBody, VerifyEmailBody, RefreshTokenBody } from "@workspace/api-zod";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

const router = Router();
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_key_123456";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key_123456";

// Whitelist of allowed campus email suffixes
const ALLOWED_CAMPUS_DOMAINS = [".edu", ".ac.in", ".edu.in", ".edu.co", ".edu.mo"];

function isValidCampusEmail(email: string): boolean {
  const emailLower = email.toLowerCase();
  return ALLOWED_CAMPUS_DOMAINS.some(domain => emailLower.endsWith(domain));
}

// POST /auth/register - Request Magic Link
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const bodyResult = RegisterBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { email } = bodyResult.data;
    if (!isValidCampusEmail(email)) {
       res.status(400).json({ error: "Only approved college email domains (.edu, .ac.in) are permitted to register" });
       return;
    }

    // Generate random 6-digit verification code for Magic Link (fixed 123456 for demo accounts)
    const emailLower = email.toLowerCase();
    const isDemo = emailLower === "demo@college.edu" || emailLower === "demo@campuspulse.edu";
    const code = isDemo ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with a 10-minute expiration
    await redis.set(`auth:verification:${emailLower}`, code, "EX", 600);

    // Dispatch via Resend API if API Key is configured
    let emailDispatched = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "CampusPulse <noreply@campuspulse.edu>",
            to: email,
            subject: "CampusPulse Magic Link Verification Code",
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; color: #1f2937;">
                <h2 style="color: #7c3aed; margin-bottom: 16px;">CampusPulse</h2>
                <p>Hello,</p>
                <p>Use the following 6-digit magic code to verify your college email address and complete your registration:</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 24px 0; color: #111827;">
                  ${code}
                </div>
                <p>This code will expire in 10 minutes. If you did not initiate this request, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                <p style="font-size: 12px; color: #6b7280;">This is an automated email from CampusPulse. Please do not reply.</p>
              </div>
            `
          })
        });

        if (response.ok) {
          logger.info(`[AUTH] Magic Link code successfully sent to ${email} via Resend.`);
          emailDispatched = true;
        } else {
          const errBody = await response.text();
          logger.error({ errBody, status: response.status }, "[AUTH] Failed to send email via Resend.");
        }
      } catch (emailErr) {
        logger.error({ emailErr }, "[AUTH] Resend API fetch failed.");
      }
    }

    // Fallback: log the code for local dev loop if Resend was not used or failed
    if (!emailDispatched) {
      logger.info(`[DEV AUTH] Magic Link code for ${email} is: ${code}`);
    }
    
    res.status(200).json({ 
      message: "Verification Magic Link code dispatched.",
      devToken: !emailDispatched ? code : undefined // Only return token to client if we didn't send a real email
    });
  } catch (err) {
    logger.error({ err }, "Error in /auth/register");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/verify - Verify code and login / register
router.post("/auth/verify", async (req: Request, res: Response) => {
  try {
    const bodyResult = VerifyEmailBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { email, token } = bodyResult.data;
    const emailKey = email.toLowerCase();
    
    // Fetch code from Redis
    const savedCode = await redis.get(`auth:verification:${emailKey}`);
    if (!savedCode || savedCode !== token) {
       res.status(400).json({ error: "Invalid or expired verification code" });
       return;
    }

    // Clear verification code from Redis on successful verify
    await redis.del(`auth:verification:${emailKey}`);

    // Parse domain
    const emailParts = emailKey.split("@");
    const campusDomain = emailParts[emailParts.length - 1];

    // Check if user already exists
    let user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, emailKey))
      .limit(1)
      .then(rows => rows[0]);

    // If new user, create a stub profile that can be completed later
    if (!user) {
      const parsedName = emailParts[0];
      const fullName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
      
      const newUsers = await db.insert(usersTable)
        .values({
          email: emailKey,
          fullName,
          major: "Undeclared",
          graduationYear: new Date().getFullYear() + 4,
          campusDomain,
        })
        .returning();
      user = newUsers[0];
    }

    // Generate JWT access & refresh tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, domain: user.campusDomain },
      JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        major: user.major,
        graduationYear: user.graduationYear,
        profilePicture: user.profilePicture,
        bio: user.bio,
        campusDomain: user.campusDomain
      }
    });
  } catch (err) {
    logger.error({ err }, "Error in /auth/verify");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/refresh - Refresh credentials
router.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const bodyResult = RefreshTokenBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { refreshToken } = bodyResult.data;
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
       res.status(401).json({ error: "Invalid or expired refresh token" });
       return;
    }

    // Fetch user details
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.sub))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
       res.status(401).json({ error: "User session not found" });
       return;
    }

    // Generate new access & refresh tokens
    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email, domain: user.campusDomain },
      JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    logger.error({ err }, "Error in /auth/refresh");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
