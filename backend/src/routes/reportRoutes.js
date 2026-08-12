import express from "express";

import {
  getInventoryReport,
  getSummaryReport,
} from "../controllers/reportController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Inventory report
router.get("/inventory", authenticate, getInventoryReport);

// Summary report
router.get("/summary", authenticate, getSummaryReport);

export default router;
