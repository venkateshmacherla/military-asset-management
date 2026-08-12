import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { testDatabaseConnection } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import baseRoutes from "./routes/baseRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import expenditureRoutes from "./routes/expenditureRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic security
app.use(helmet());

// Allow frontend requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API status
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API is running",
    database: "PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Asset routes
app.use("/api/assets", assetRoutes);

// Transfer routes
app.use("/api/transfers", transferRoutes);

// Base routes
app.use("/api/bases", baseRoutes);

// Equipment routes
app.use("/api/equipment-types", equipmentRoutes);

// Purchase routes
app.use("/api/purchases", purchaseRoutes);

// Assignment routes
app.use("/api/assignments", assignmentRoutes);

// Expenditure routes
app.use("/api/expenditures", expenditureRoutes);

// Audit log routes
app.use("/api/audit-logs", auditRoutes);

// Report routes
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
