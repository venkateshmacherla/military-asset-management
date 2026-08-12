import express from "express";

import {
  createTransfer,
  getTransfers,
  getTransferById,
} from "../controllers/transferController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all transfers
router.get("/", authenticate, getTransfers);

// Get one transfer
router.get("/:id", authenticate, getTransferById);

// Create transfer
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createTransfer,
);

export default router;
