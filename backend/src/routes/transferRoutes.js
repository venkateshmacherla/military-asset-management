import express from "express";

import {
  createTransfer,
  getTransfers,
  getTransferById,
} from "../controllers/transferController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * View transfer history
 */
router.get("/", authenticate, getTransfers);

/*
 * View a single transfer
 */
router.get("/:id", authenticate, getTransferById);

/*
Create a new transfer
Admin, Base Commander and Logistics Officer
are allowed to move inventory.
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createTransfer,
);

export default router;
