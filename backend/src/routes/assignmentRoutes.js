import express from "express";

import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// View assignments
router.get("/", authenticate, getAssignments);

// View one assignment
router.get("/:id", authenticate, getAssignmentById);

// Create assignment
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createAssignment,
);

// Update assignment
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  updateAssignment,
);

// Delete assignment
router.delete("/:id", authenticate, authorize("ADMIN"), deleteAssignment);

export default router;
