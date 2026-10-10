import { test } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, chunkBlog, toGeminiHistory, topChunks } from "../services/rag.js";
import { escapeRegex, sanitizeBlogHtml, stripHtml } from "../utils/html.js";

test("cosineSimilarity: identical, opposite and zero vectors", () => {
  assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]).toFixed(6), "1.000000");
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
});

test("topChunks returns the k most similar chunks, best first", () => {
  const result = topChunks([1, 0], ["a", "b", "c", "d"], [[0, 1], [1, 0], [0.7, 0.7], [-1, 0]], 2);
  assert.deepEqual(result.map((r) => r.text), ["b", "c"]);
});

test("chunkBlog strips HTML and splits long blogs into overlapping chunks", async () => {
  const description = `<p>${"word ".repeat(600)}</p><script>alert(1)</script>`;
  const chunks = await chunkBlog({ title: "T", category: "Technology", description });
  assert.ok(chunks.length >= 3, "a ~3000 char blog should give several chunks");
  assert.ok(chunks.every((c) => c.length <= 1000));
  assert.ok(chunks.every((c) => !c.includes("<p>")));
});

test("toGeminiHistory keeps the last turns, maps roles and starts with a user turn", () => {
  const history = [
    { role: "assistant", content: "hi" },
    ...Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` })),
    { role: "user", content: "" },
    null,
  ];
  const out = toGeminiHistory(history);
  assert.ok(out.length <= 10);
  assert.equal(out[0].role, "user");
  assert.ok(out.every((m) => m.role === "user" || m.role === "model"));
  assert.deepEqual(toGeminiHistory("not an array"), []);
});

test("sanitizeBlogHtml removes scripts and event handlers but keeps formatting", () => {
  const dirty = `<h2 class="ql-align-center">Hi</h2><p onclick="x()">Text <strong>bold</strong></p>
    <img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">bad</a>
    <ol><li data-list="bullet">item</li></ol>`;
  const clean = sanitizeBlogHtml(dirty);
  assert.match(clean, /<h2 class="ql-align-center">Hi<\/h2>/);
  assert.match(clean, /<strong>bold<\/strong>/);
  assert.match(clean, /<li data-list="bullet">item<\/li>/);
  assert.doesNotMatch(clean, /script|onerror|onclick|javascript:/i);
});

test("stripHtml and escapeRegex", () => {
  assert.equal(stripHtml("<p>Hello&nbsp;<b>world</b></p>"), "Hello world");
  assert.equal(escapeRegex("c++ (beta)"), "c\\+\\+ \\(beta\\)");
});
