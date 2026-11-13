import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

