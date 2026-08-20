import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

// Healthcheck & Database status endpoint
app.get("/api/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : dbState === 3
      ? "disconnecting"
      : "disconnected";

  res.json({
    status: "ok",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// TODO: Thêm routes của bạn ở đây

export default app;
