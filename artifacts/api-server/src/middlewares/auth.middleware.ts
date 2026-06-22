import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    campusDomain: string;
  };
}

export function verifyJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "temp_secret") as any;
    req.user = {
      id: payload.sub,
      email: payload.email,
      campusDomain: payload.domain,
    };
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired access token" });
    return;
  }
}
