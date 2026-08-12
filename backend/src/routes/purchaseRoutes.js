import express from "express";

import {
  getPurchases,
  getPurchaseById,
  createPurchase,
} from "../controllers/purchaseController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all purchase records
router.get("/", authenticate, getPurchases);

// View one purchase record
router.get("/:id", authenticate, getPurchaseById);

// Create a new purchase
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createPurchase,
);

export default router;
