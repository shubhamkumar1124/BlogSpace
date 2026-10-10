import express from "express";
import { authLimiter } from "../middleware/security.js";
import {
  login,
  getAllBlogs,
  getBlogById,
  searchBlogs,
  signup,
  profile,
  logout,
} from "../controllers/blogController.js";

const blogRouter = express.Router();

blogRouter.post("/signup", authLimiter, signup);
blogRouter.post("/login", authLimiter, login);
blogRouter.get("/profile", profile);
blogRouter.post("/logout", logout);
blogRouter.get("/all", getAllBlogs);
blogRouter.get("/", searchBlogs);
blogRouter.get("/:blogId", getBlogById);

export default blogRouter;
