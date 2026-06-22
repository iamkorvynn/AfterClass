import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import crypto from "crypto";

export interface AnonymousRequest extends AuthenticatedRequest {
  anonContext?: {
    campusDomain: string;
    ownerHash: string;
  };
}

export function anonymizeRequest(entityIdKey: string = "id") {
  return (req: AnonymousRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const entityId = req.params[entityIdKey] || req.body.entityId || crypto.randomUUID();
    const salt = process.env.ANON_SECRET_SALT || "fallback_salt";

    // Cryptographic signature: HMAC_SHA256(user_id, entity_id + salt)
    // Allows ownership validation without mapping user ID directly.
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(`${req.user.id}:${entityId}`);
    const ownerHash = hmac.digest("hex");

    req.anonContext = {
      campusDomain: req.user.campusDomain,
      ownerHash,
    };

    // Strip client identifying metadata from the headers
    req.headers["x-forwarded-for"] = undefined;
    req.headers["user-agent"] = undefined;
    
    // Unlink the user object to prevent logging or subsequent usage
    req.user = undefined;

    next();
  };
}
