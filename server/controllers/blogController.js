import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Blog from "../models/blog.js";
import User from "../models/user.js";
import { getJwtSecret, getCookieOptions } from "../config/env.js";
import { escapeRegex } from "../utils/html.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid name and email" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    // Older accounts may have been saved with capital letters, so match both.
    const user = await User.findOne({ email: { $in: [email, email.toLowerCase()] } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.cookie("token", token, getCookieOptions()).json({
      success: true,
      message: "Login successful",
      // userId matches what /profile returns, which the navbar and "My Blogs" use.
      user: { id: user._id, userId: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const profile = (req, res) => {
  const { token } = req.cookies || {};
  if (!token) return res.status(401).json({ success: false, message: "No token found" });

  try {
    const { userId, email, name } = jwt.verify(token, getJwtSecret());
    res.json({ userId, email, name });
  } catch {
    res.status(401).json({ success: false, message: "Token is invalid or expired" });
  }
};

export const logout = (req, res) => {
  const { maxAge, ...options } = getCookieOptions();
  res.clearCookie("token", options).json({ success: true, message: "Logged out successfully" });
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({ success: false, message: "Could not load blogs" });
  }
};

export const searchBlogs = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 100);
    const category = String(req.query.category || "").trim();
    const filter = {};

    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: "i" };
      // The old query searched a "content" field that doesn't exist; blog
      // text lives in "description".
      filter.$or = [{ title: pattern }, { subTitle: pattern }, { description: pattern }];
    }
    if (category && category !== "All") filter.category = category;

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, blogs });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBlogById = async (req, res) => {
  const { blogId } = req.params;
  if (!mongoose.isValidObjectId(blogId)) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  try {
    const blog = await Blog.findById(blogId).populate("author", "name");
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, blog });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({ success: false, message: "Could not load blog" });
  }
};
