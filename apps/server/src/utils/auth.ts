import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config.js";
import type { AuthContext } from "../types/express.d.js";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthContext): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): AuthContext {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AuthContext;
  if (!decoded || !decoded.userId || !decoded.email) {
    throw new Error("Invalid token payload");
  }
  return {
    userId: decoded.userId,
    email: decoded.email,
  };
}
