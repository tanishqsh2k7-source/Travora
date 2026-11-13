import { Router } from "express";
import { UpdatePreferencesRequestSchema } from "@travora/contracts";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { UserPreferenceModel } from "../models/index.js";

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);

/**
 * GET /api/v1/me/preferences
 */
preferencesRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    let pref = await UserPreferenceModel.findOne({ userId });
    if (!pref) {
      pref = await UserPreferenceModel.create({ userId });
    }
    res.json(pref);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/me/preferences
 */
preferencesRouter.patch(
  "/",
  validateBody(UpdatePreferencesRequestSchema),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const updates = req.body;

      const pref = await UserPreferenceModel.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
      );

      res.json(pref);
    } catch (err) {
      next(err);
    }
  }
);

