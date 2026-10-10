import express from "express";
import { chatWithBlog } from "../controllers/chatController.js";
import { chatLimiter } from "../middleware/security.js";

const chatRouter = express.Router();

chatRouter.post("/", chatLimiter, chatWithBlog);

export default chatRouter;
