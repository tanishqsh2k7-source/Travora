import { Router } from "express";
import { RegisterRequestSchema, LoginRequestSchema } from "@travora/contracts";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { UserModel, UserPreferenceModel } from "../models/index.js";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(RegisterRequestSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      email,
      passwordHash,
      name,
    });

    // Create default preferences
    await UserPreferenceModel.create({
      userId: user._id,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validateBody(LoginRequestSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const user = await UserModel.findById(userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const preferences = await UserPreferenceModel.findOne({ userId });

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      preferences: preferences ?? null,
    });
  } catch (err) {
    next(err);
  }
});
