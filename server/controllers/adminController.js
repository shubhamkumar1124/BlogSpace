import mongoose from "mongoose";
import Blog from "../models/blog.js";
import { uploadBlogImage } from "../config/imageKit.js";
import generateBlogContent from "../config/gemini.js";
import { sanitizeBlogHtml, stripHtml } from "../utils/html.js";
import { deleteBlogChunks, indexBlogInBackground } from "./chatController.js";

const CATEGORIES = ["Technology", "Startup", "Lifestyle", "Finance"];

const parseBlogField = (req) => {
  try {
    return JSON.parse(req.body?.blog || "{}");
  } catch {
    return null;
  }
};

const validateBlog = ({ title, description, category }) => {
  if (!String(title || "").trim()) return "Title is required";
  if (!stripHtml(description)) return "Blog content is required";
  if (!CATEGORIES.includes(category)) return "Please select a category";
  return null;
};

// Loads a blog and checks the logged-in user wrote it.
const findOwnBlog = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: "Blog not found" };
  const blog = await Blog.findById(id);
  if (!blog) return { status: 404, message: "Blog not found" };
  if (blog.author?.toString() !== userId) {
    return { status: 403, message: "You can only change your own blogs" };
  }
  return { blog };
};

export const addBlog = async (req, res) => {
  const data = parseBlogField(req);
  if (!data) return res.status(400).json({ success: false, message: "Invalid blog data" });

  const error = validateBlog(data) || (!req.file && "Thumbnail image is required");
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const image = await uploadBlogImage(req.file);
    const blog = await Blog.create({
      title: data.title,
      subTitle: data.subTitle,
      description: sanitizeBlogHtml(data.description),
      category: data.category,
      image,
      author: req.user.userId,
    });

    indexBlogInBackground(blog._id); // build RAG embeddings now, not on first question
    res.status(201).json({ success: true, message: "Blog added successfully", blogId: blog._id });
  } catch (err) {
    console.error("Add blog error:", err);
    res.status(500).json({ success: false, message: "Could not add the blog" });
  }
};

export const updateBlogById = async (req, res) => {
  const data = parseBlogField(req);
  if (!data) return res.status(400).json({ success: false, message: "Invalid blog data" });

  const error = validateBlog(data);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    // Before: any logged-in user could edit anyone's blog.
    const { blog, status, message } = await findOwnBlog(req.params.id, req.user.userId);
    if (!blog) return res.status(status).json({ success: false, message });

    blog.title = data.title;
    blog.subTitle = data.subTitle;
    blog.description = sanitizeBlogHtml(data.description);
    blog.category = data.category;

    // Before: a new image was saved as "/uploads/<file>", a path nothing
    // served, so the thumbnail broke. Now it goes to ImageKit like addBlog.
    if (req.file) blog.image = await uploadBlogImage(req.file);

    await blog.save();

    // Before: the chatbot kept answering from the OLD text after an edit,
    // because cached chunks were never refreshed. Chunks are versioned by
    // updatedAt now, so this edit makes the old ones stale; rebuild right away.
    indexBlogInBackground(blog._id);

    res.json({ success: true, message: "Blog updated successfully", blog });
  } catch (err) {
    console.error("Update blog error:", err);
    res.status(500).json({ success: false, message: "Something went wrong while updating the blog" });
  }
};

export const deleteBlogById = async (req, res) => {
  try {
    const { blog, status, message } = await findOwnBlog(req.params.id, req.user.userId);
    if (!blog) return res.status(status).json({ success: false, message });

    await blog.deleteOne();
    await deleteBlogChunks(blog._id);
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ success: false, message: "Could not delete the blog" });
  }
};

export const generateContent = async (req, res) => {
  const topic = String(req.body?.prompt || "").trim().slice(0, 200);
  if (!topic) return res.status(400).json({ success: false, message: "Please enter a title first" });

  try {
    const content = await generateBlogContent(`Write a detailed blog post about the topic below.
- 600-800 words
- Include an intro, 3-4 sections with headings, and a conclusion
- Use bullet points where useful
- Professional, conversational tone
- Output Markdown only

Topic: ${JSON.stringify(topic)}`);

    if (!content) return res.status(502).json({ success: false, message: "AI returned an empty response" });
    res.json({ success: true, content });
  } catch (err) {
    console.error("Generate content error:", err);
    res.status(502).json({ success: false, message: "AI service is unavailable right now, please try again" });
  }
};
