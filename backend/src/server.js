import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { testDatabaseConnection } from "./config/db.js";

import { authenticate, authorize } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import baseRoutes from "./routes/baseRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* Basic middleware */

// Allow the server to receive JSON request bodies
app.use(express.json({ limit: "10mb" }));

// Support form-urlencoded request bodies
app.use(express.urlencoded({ extended: true }));

// Add some basic security-related HTTP headers
app.use(helmet());

// Allow requests from the frontend application
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/* Public API routes */

// Simple API check
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API",
  });
});

// Health check for the backend and database
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API is running",
    database: "PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/assets", assetRoutes);

app.use("/api/transfers", transferRoutes);

app.use("/api/bases", baseRoutes);

app.use("/api/equipment-types", equipmentRoutes);

app.use("/api/purchases", purchaseRoutes);

app.use("/api/assignments", assignmentRoutes);

/* Protected test route */
app.get("/api/protected", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You accessed a protected route",
    user: req.user,
  });
});

/* Admin-only test route */

app.get("/api/admin/test", authenticate, authorize("ADMIN"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",
    user: req.user,
  });
});

/* 404 handler */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/*Start the server */

const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
