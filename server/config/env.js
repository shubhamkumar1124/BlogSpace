import dotenv from "dotenv";
dotenv.config();

// The original code signed tokens with SECRET_KEY but verified them with
// JWT_SECRET, so every protected route failed unless both were set.
// One getter for both places fixes that; SECRET_KEY still works for old .env files.
export const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;

export const getAllowedOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

// "lax" is safest when the frontend and API share one site (single Render
// service or the Vite dev proxy). Set COOKIE_SAMESITE=none only when the
// frontend is on a different domain and calls the API directly.
export const getCookieOptions = () => {
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  return {
    httpOnly: true,
    secure: sameSite === "none" || process.env.NODE_ENV === "production",
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const checkEnv = () => {
  const required = ["MONGODB_URI", "GEMINI_API_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (!getJwtSecret()) missing.push("JWT_SECRET");
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  const imageKit = ["IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINT"];
  if (imageKit.some((k) => !process.env[k])) {
    console.warn("ImageKit keys missing: creating blogs with images will fail.");
  }
};
