import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { getAllowedOrigins } from "../config/env.js";

const limiter = (options) =>
  rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please slow down and try again shortly." },
    ...options,
  });

// Login/signup: slows down password guessing.
export const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 20 });

// Chat is public and every question costs a Gemini call.
export const chatLimiter = limiter({ windowMs: 60 * 1000, limit: 15 });

// AI blog generation: per logged-in user (the old code declared a rate-limit
// map but never used it).
export const generateLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req.ip),
});

// CSRF guard: browsers always send Origin on cross-site POST/PUT/DELETE, so a
// state-changing request from any site not in CLIENT_URL is rejected.
export const originGuard = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // curl/Postman/server-to-server
  const self = `${req.protocol}://${req.get("host")}`;
  if (origin === self || getAllowedOrigins().includes(origin)) return next();
  return res.status(403).json({ success: false, message: "Origin not allowed" });
};
