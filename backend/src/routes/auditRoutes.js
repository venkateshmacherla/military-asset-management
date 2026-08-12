import express from "express";

import {
  getAuditLogs,
  getAuditLogById,
} from "../controllers/auditController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// View audit logs
router.get("/", authenticate, authorize("ADMIN"), getAuditLogs);

// View one audit log
router.get("/:id", authenticate, authorize("ADMIN"), getAuditLogById);

export default router;
