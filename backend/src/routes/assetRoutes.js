import express from "express";

import {
  getDashboardSummary,
  getAssets,
  getAssetById,
  createAsset,
  updateAssetQuantity,
  deleteAsset,
} from "../controllers/assetController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Dashboard */

router.get("/dashboard", authenticate, getDashboardSummary);

/* Inventory */

router.get("/", authenticate, getAssets);

router.get("/:id", authenticate, getAssetById);

/* Inventory Management */

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createAsset,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  updateAssetQuantity,
);

router.delete("/:id", authenticate, authorize("ADMIN"), deleteAsset);

export default router;
