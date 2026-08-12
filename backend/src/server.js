import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { testDatabaseConnection } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate, authorize } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API ROUTES

app.get("/api", (req, res) => {
  res.json({
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

// Authentication
app.use("/api/auth", authRoutes);

// Protected test route
app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "You accessed a protected route",
    user: req.user,
  });
});

// Admin-only test route
app.get("/api/admin/test", authenticate, authorize("ADMIN"), (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
    user: req.user,
  });
});

// 404 HANDLER

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// START SERVER

const startServer = async () => {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
