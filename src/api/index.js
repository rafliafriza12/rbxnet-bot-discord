import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import usersRouter from "./routes/users.js";
import { apiKeyAuth, rateLimit } from "./middleware/auth.js";

export const createServer = (botClient = null) => {
  const app = express();

  // Store bot client for use in routes
  if (botClient) {
    app.set("botClient", botClient);
  }

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(rateLimit(100, 60000)); // 100 requests per minute

  // Health check (no auth required)
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes (with optional auth)
  app.use("/api/users", apiKeyAuth, usersRouter);

  // Root route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Discord Bot API",
      version: "1.0.0",
      endpoints: {
        health: "GET /health",
        users: "GET /api/users",
      },
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("API Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  });

  return app;
};

export default createServer;
