import express from "express";

import {
  getExpenditures,
  getExpenditureById,
  createExpenditure,
} from "../controllers/expenditureController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// View expenditures
router.get("/", authenticate, getExpenditures);

// View one expenditure
router.get("/:id", authenticate, getExpenditureById);

// Record expenditure
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createExpenditure,
);

export default router;
