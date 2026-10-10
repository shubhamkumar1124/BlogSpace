// Integration tests: real Express app + real MongoDB, with the paid/external
// services (Gemini, ImageKit, the embedding model) replaced by fakes.
// Run with: TEST_MONGODB_URI=mongodb://127.0.0.1:27017/blogspace_test npm test
import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";

const TEST_DB = process.env.TEST_MONGODB_URI;
const skip = !TEST_DB && "set TEST_MONGODB_URI to run API tests";

let app, request, mongoose, BlogChunk;
const aiCalls = [];

// Tiny deterministic "embedding": word-hash buckets. Good enough to check that
// retrieval picks the chunk sharing words with the question.
const fakeEmbed = async (text) => {
  const vec = new Array(64).fill(0);
  for (const w of text.toLowerCase().match(/[a-z]+/g) || []) {
    let h = 0;
    for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    vec[h % 64] += 1;
  }
  return vec;
};

before(async () => {
  if (skip) return;
  process.env.MONGODB_URI = TEST_DB;
  process.env.JWT_SECRET = "test-secret";
  process.env.GEMINI_API_KEY = "fake";
  process.env.CLIENT_URL = "http://localhost:5173";

  const rag = await import("../services/rag.js");
  mock.module(new URL("../services/rag.js", import.meta.url).href, {
    namedExports: { ...rag, embedText: fakeEmbed, warmUpEmbedder: () => {} },
  });
  mock.module(new URL("../config/gemini.js", import.meta.url).href, {
    defaultExport: async () => "# Generated\n\nSome **markdown**.",
    namedExports: {
      GEMINI_MODEL: "fake",
      answerWithContext: async (args) => {
        aiCalls.push(args);
        return "Mock answer";
      },
    },
  });
  mock.module(new URL("../config/imageKit.js", import.meta.url).href, {
    defaultExport: () => ({}),
    namedExports: { uploadBlogImage: async () => "https://ik.imagekit.io/test/blog.webp" },
  });

  ({ default: request } = await import("supertest"));
  ({ default: mongoose } = await import("mongoose"));
  ({ default: app } = await import("../app.js"));
  ({ default: BlogChunk } = await import("../models/blogChunk.js"));
  await mongoose.connect(TEST_DB);
  await mongoose.connection.db.dropDatabase();
});

after(async () => {
  if (skip) return;
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

const signupAndLogin = async (name, email) => {
  await request(app).post("/api/blog/signup").send({ name, email, password: "secret123" }).expect(201);
  const res = await request(app).post("/api/blog/login").send({ email, password: "secret123" }).expect(200);
  return res.headers["set-cookie"];
};

const addBlog = (cookie, blog) =>
  request(app)
    .post("/api/admin/add")
    .set("Cookie", cookie)
    .field("blog", JSON.stringify(blog))
    .attach("image", Buffer.from("fake-png"), { filename: "a.png", contentType: "image/png" });

const waitForChunks = async (blogId, mustInclude) => {
  for (let i = 0; i < 50; i++) {
    const chunks = await BlogChunk.find({ blog: blogId }).lean();
    if (chunks.length && (!mustInclude || chunks.some((c) => c.text.includes(mustInclude)))) return chunks;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("chunks were not built");
};

const state = {};

test("health check", { skip }, async () => {
  const res = await request(app).get("/health").expect(200);
  assert.equal(res.body.db, "connected");
});

test("signup validates input and rejects duplicates", { skip }, async () => {
  await request(app).post("/api/blog/signup").send({ name: "A", email: "bad", password: "secret123" }).expect(400);
  await request(app).post("/api/blog/signup").send({ name: "A", email: "a@x.com", password: "123" }).expect(400);
  state.cookieA = await signupAndLogin("Alice", "Alice@X.com");
  await request(app).post("/api/blog/signup").send({ name: "A2", email: "alice@x.com", password: "secret123" }).expect(400);
});

test("login sets an httpOnly cookie that protected routes accept (JWT secret bug fixed)", { skip }, async () => {
  await request(app).post("/api/blog/login").send({ email: "alice@x.com", password: "wrong" }).expect(401);
  const cookie = state.cookieA.join(";");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  const me = await request(app).get("/api/blog/profile").set("Cookie", state.cookieA).expect(200);
  assert.equal(me.body.name, "Alice");
  state.userA = me.body.userId;
});

test("protected routes reject missing cookies", { skip }, async () => {
  await request(app).post("/api/admin/generateContent").send({ prompt: "x" }).expect(401);
});

test("adding a blog sanitizes HTML and builds RAG chunks in the background", { skip }, async () => {
  const res = await addBlog(state.cookieA, {
    title: "Learning Docker",
    subTitle: "Containers 101",
    category: "Technology",
    description:
      `<p>Docker containers package an application with its dependencies.</p><img src=x onerror="alert(1)">` +
      `<p>${"Kubernetes orchestrates many containers across machines. ".repeat(40)}</p>` +
      `<p>${"Volumes keep data safe when a container restarts. ".repeat(40)}</p>`,
  }).expect(201);
  state.blogId = res.body.blogId;

  const detail = await request(app).get(`/api/blog/${state.blogId}`).expect(200);
  assert.doesNotMatch(detail.body.blog.description, /onerror/);
  assert.equal(detail.body.blog.author.name, "Alice");
  assert.equal(detail.body.blog.chunkEmbeddings, undefined);

  const chunks = await waitForChunks(state.blogId);
  assert.ok(chunks.length >= 2);
});

test("blog lists never include embeddings", { skip }, async () => {
  const all = await request(app).get("/api/blog/all").expect(200);
  assert.equal(all.body.blogs.length, 1);
  assert.equal(all.body.blogs[0].chunkEmbeddings, undefined);
});

test("search looks in blog text and is safe with special characters", { skip }, async () => {
  const hit = await request(app).get("/api/blog").query({ search: "kubernetes" }).expect(200);
  assert.equal(hit.body.count, 1);
  const miss = await request(app).get("/api/blog").query({ search: "(a+)+[" }).expect(200);
  assert.equal(miss.body.count, 0);
  const cat = await request(app).get("/api/blog").query({ category: "Finance" }).expect(200);
  assert.equal(cat.body.count, 0);
});

test("other users cannot edit or delete someone else's blog", { skip }, async () => {
  const cookieB = await signupAndLogin("Bob", "bob@x.com");
  const blog = JSON.stringify({ title: "Hacked", category: "Technology", description: "<p>x</p>" });
  await request(app).put(`/api/admin/updateBlog/${state.blogId}`).set("Cookie", cookieB).field("blog", blog).expect(403);
  await request(app).delete(`/api/admin/deleteBlog/${state.blogId}`).set("Cookie", cookieB).expect(403);
  await request(app).delete(`/api/admin/deleteBlog/not-an-id`).set("Cookie", cookieB).expect(404);
});

test("chat retrieves the relevant chunk and returns sources", { skip }, async () => {
  aiCalls.length = 0;
  const res = await request(app)
    .post("/api/chat")
    .send({ blogId: state.blogId, question: "What do volumes do when a container restarts?", history: [{ role: "assistant", content: "Hi!" }] })
    .expect(200);
  assert.equal(res.body.answer, "Mock answer");
  assert.ok(res.body.sources.length >= 1);
  const ctx = aiCalls[0].systemInstruction;
  assert.match(ctx.split("[2]")[0], /Volumes/, "best chunk should be the one about volumes");
  assert.equal(aiCalls[0].history.length, 0, "leading assistant greeting is dropped");
});

test("editing a blog refreshes what the chatbot knows", { skip }, async () => {
  const blog = JSON.stringify({ title: "Learning Podman", category: "Technology", description: "<p>Podman runs containers without a daemon.</p>" });
  await request(app).put(`/api/admin/updateBlog/${state.blogId}`).set("Cookie", state.cookieA).field("blog", blog).expect(200);

  aiCalls.length = 0;
  await request(app).post("/api/chat").send({ blogId: state.blogId, question: "What is Podman?" }).expect(200);
  assert.match(aiCalls[0].systemInstruction, /Podman runs containers without a daemon/);
  assert.doesNotMatch(aiCalls[0].systemInstruction, /Kubernetes/);
});

test("chat validates input", { skip }, async () => {
  await request(app).post("/api/chat").send({ blogId: state.blogId }).expect(400);
  await request(app).post("/api/chat").send({ blogId: state.blogId, question: "x".repeat(501) }).expect(400);
  await request(app).post("/api/chat").send({ blogId: "123", question: "hi" }).expect(404);
});

test("requests from other websites are blocked (CSRF guard)", { skip }, async () => {
  await request(app)
    .delete(`/api/admin/deleteBlog/${state.blogId}`)
    .set("Cookie", state.cookieA)
    .set("Origin", "https://evil.example")
    .expect(403);
  await request(app)
    .post("/api/admin/generateContent")
    .set("Cookie", state.cookieA)
    .set("Origin", "http://localhost:5173")
    .send({ prompt: "Docker tips" })
    .expect(200);
});

test("owner can delete their blog and its chunks", { skip }, async () => {
  await request(app).delete(`/api/admin/deleteBlog/${state.blogId}`).set("Cookie", state.cookieA).expect(200);
  assert.equal(await BlogChunk.countDocuments({ blog: state.blogId }), 0);
  await request(app).get(`/api/blog/${state.blogId}`).expect(404);
});
