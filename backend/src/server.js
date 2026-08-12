import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/**
 * Security middleware
 */
app.use(helmet());

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/**
 * JSON body parser
 */
app.use(express.json());

/**
 * URL encoded body parser
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root API endpoint
 */
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Military Asset Management API",
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
