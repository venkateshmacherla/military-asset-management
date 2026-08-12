import express from "express";

import {
  createTransfer,
  getTransfers,
} from "../controllers/transferController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  getTransfers,
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"),
  createTransfer,
);

export default router;
