import mongoose from "mongoose";

// One document per RAG chunk. Keeping chunks in their own collection (instead
// of two parallel arrays inside each blog) keeps blog documents small and is
// the layout MongoDB Atlas Vector Search expects if you later want to search
// across all blogs.
const blogChunkSchema = new mongoose.Schema(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    position: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    // blog.updatedAt when these chunks were built. If the blog is edited
    // later the versions no longer match and the chunks are rebuilt.
    version: { type: Date, required: true },
  },
  { timestamps: false }
);

blogChunkSchema.index({ blog: 1, position: 1 });

const BlogChunk = mongoose.model("BlogChunk", blogChunkSchema);
export default BlogChunk;
