import express from "express";

import {
  getEquipmentTypes,
  getEquipmentTypeById,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
} from "../controllers/equipmentController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

//
router.get("/", authenticate, getEquipmentTypes);

// View one equipment type
router.get("/:id", authenticate, getEquipmentTypeById);

// Create a new equipment type
router.post("/", authenticate, authorize("ADMIN"), createEquipmentType);

// Update equipment type
router.patch("/:id", authenticate, authorize("ADMIN"), updateEquipmentType);

// Delete equipment type
router.delete("/:id", authenticate, authorize("ADMIN"), deleteEquipmentType);

export default router;
