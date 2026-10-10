import "./config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import adminRouter from "./routes/adminRoutes.js";
import blogRouter from "./routes/blogRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import { getAllowedOrigins } from "./config/env.js";
import { originGuard } from "./middleware/security.js";

const app = express();

// Render/Vercel sit in front of the app; needed for correct client IPs
// (rate limiting) and https detection.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
app.disable("x-powered-by");

// Before: `origin: true` + credentials let ANY website make logged-in
// requests on a user's behalf. Now only the URLs in CLIENT_URL are allowed.
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || getAllowedOrigins().includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(originGuard);

app.get("/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/blog", blogRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chat", chatRouter);

app.use("/api", (req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Single-service deploy: if the React build exists, serve it from here so the
// frontend and API share one URL (no CORS or third-party cookie problems).
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client/dist");
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// Central error handler (Express 5 forwards async errors here).
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Image must be under 5 MB" });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: status >= 500 ? "Server error" : err.message });
});

export default app;
