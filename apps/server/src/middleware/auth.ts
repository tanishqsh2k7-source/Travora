import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (typeof req.query.token === "string" && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

