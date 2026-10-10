import express from "express";
import upload from "../middleware/multerMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateLimiter } from "../middleware/security.js";
import {
  addBlog,
  deleteBlogById,
  generateContent,
  updateBlogById,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.use(authMiddleware);

adminRouter.post("/add", upload.single("image"), addBlog);
adminRouter.put("/updateBlog/:id", upload.single("image"), updateBlogById);
adminRouter.delete("/deleteBlog/:id", deleteBlogById);
adminRouter.post("/generateContent", generateLimiter, generateContent);

export default adminRouter;
