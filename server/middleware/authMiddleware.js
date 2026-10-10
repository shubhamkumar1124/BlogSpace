import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Please log in first" });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired, please log in again" });
  }
};
