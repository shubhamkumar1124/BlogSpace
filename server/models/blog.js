import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subTitle: { type: String, trim: true, maxlength: 300 },
    description: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    // Legacy RAG cache from the first version (chunks now live in the
    // BlogChunk collection). Kept only so old documents never send these big
    // arrays to the browser; they are removed when a blog is re-indexed.
    chunkTexts: { type: [String], select: false },
    chunkEmbeddings: { type: [[Number]], select: false },
  },
  { timestamps: true }
);

blogSchema.index({ createdAt: -1 });

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
