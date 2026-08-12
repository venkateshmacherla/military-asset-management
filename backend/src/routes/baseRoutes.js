import express from "express";

import {
  getBases,
  getBaseById,
  createBase,
  updateBase,
  deleteBase,
} from "../controllers/baseController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 View all bases
 */
router.get("/", authenticate, getBases);

/*
 View one base
 */
router.get("/:id", authenticate, getBaseById);

/*
 Create a base
 
 Base administration is restricted to Admin users.
 */
router.post("/", authenticate, authorize("ADMIN"), createBase);

/*
 Update a base
 */
router.patch("/:id", authenticate, authorize("ADMIN"), updateBase);

/*
 Delete a base
 */
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBase);

export default router;
