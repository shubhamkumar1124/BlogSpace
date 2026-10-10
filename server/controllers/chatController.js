import mongoose from "mongoose";
import Blog from "../models/blog.js";
import BlogChunk from "../models/blogChunk.js";
import { answerWithContext } from "../config/gemini.js";
import {
  MAX_QUESTION_CHARS,
  buildSystemInstruction,
  chunkBlog,
  embedText,
  toGeminiHistory,
  topChunks,
} from "../services/rag.js";

const NOT_FOUND_ANSWER = "I couldn't find that in this blog.";
const inFlight = new Map(); // "blogId:version" -> Promise, so one blog is never indexed twice at once

const versionOf = (blog) => new Date(blog.updatedAt || blog.createdAt || 0);

// Chunks + embeds a blog and stores the chunks in MongoDB.
// Embeddings run one at a time: the local model is CPU-bound, so running them
// all in parallel (as before) only spiked memory on small servers.
const buildBlogIndex = async (blog) => {
  const version = versionOf(blog);
  const texts = await chunkBlog(blog);
  const chunks = [];
  for (const [position, text] of texts.entries()) {
    chunks.push({ blog: blog._id, position, text, embedding: await embedText(text), version });
  }
  await BlogChunk.deleteMany({ blog: blog._id });
  await BlogChunk.insertMany(chunks);
  await Blog.updateOne({ _id: blog._id }, { $unset: { chunkTexts: 1, chunkEmbeddings: 1 } });
  return chunks;
};

// Returns up-to-date chunks for a blog, building them if missing or stale.
// Before: chunks were cached forever, so after an edit the bot kept answering
// from the old text.
export const getBlogChunks = async (blog) => {
  const version = versionOf(blog);
  const existing = await BlogChunk.find({ blog: blog._id, version }).sort({ position: 1 }).lean();
  if (existing.length) return existing;

  const key = `${blog._id}:${version.getTime()}`;
  if (!inFlight.has(key)) {
    inFlight.set(key, buildBlogIndex(blog).finally(() => inFlight.delete(key)));
  }
  return inFlight.get(key);
};

// Fire-and-forget indexing after create/update so the first question is fast.
// If it fails, the chat endpoint builds the index on the first question instead.
export const indexBlogInBackground = (blogId) => {
  setImmediate(async () => {
    try {
      const blog = await Blog.findById(blogId).populate("author", "name");
      if (blog) await getBlogChunks(blog);
    } catch (err) {
      console.warn(`Background indexing failed for blog ${blogId}:`, err.message);
    }
  });
};

export const deleteBlogChunks = (blogId) => BlogChunk.deleteMany({ blog: blogId });

export const chatWithBlog = async (req, res) => {
  const { blogId, history = [] } = req.body || {};
  const question = String(req.body?.question || "").trim();

  if (!blogId || !question) {
    return res.status(400).json({ success: false, message: "blogId and question are required" });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return res.status(400).json({ success: false, message: `Please keep questions under ${MAX_QUESTION_CHARS} characters` });
  }
  if (!mongoose.isValidObjectId(blogId)) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  try {
    const blog = await Blog.findById(blogId).populate("author", "name");
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    const chunks = await getBlogChunks(blog);

    // Retrieve the parts of the blog most relevant to this question.
    const questionVec = await embedText(question);
    const best = topChunks(
      questionVec,
      chunks.map((c) => c.text),
      chunks.map((c) => c.embedding)
    );

    const answer = await answerWithContext({
      systemInstruction: buildSystemInstruction(blog.title, best),
      history: toGeminiHistory(history),
      question,
    });

    res.json({
      success: true,
      answer: answer?.trim() || NOT_FOUND_ANSWER,
      // Which parts of the blog the answer was based on (shown in the chat UI).
      sources: best.map((c) => ({
        snippet: c.text.replace(/^(Title|Subtitle|Category|Author|Content):\s*/gm, "").replace(/\s+/g, " ").slice(0, 180),
        score: Number(c.score.toFixed(3)),
      })),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(502).json({ success: false, message: "The assistant is unavailable right now, please try again." });
  }
};
