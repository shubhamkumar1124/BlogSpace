# Changes in v1.1

## Bugs fixed

| Problem | Effect before | Fix |
|---|---|---|
| Login signed tokens with `SECRET_KEY`, the auth middleware verified with `JWT_SECRET` | Create/edit/delete/AI-generate all returned 401 unless both variables were set | One `JWT_SECRET` (old `SECRET_KEY` still accepted) |
| Edit endpoint had no ownership check | Any logged-in user could edit anyone's blog | Owner check on edit and delete (403 otherwise) |
| New image on edit saved as `/uploads/<file>` | Thumbnail broke after changing the image | Edit uploads to ImageKit, same as create |
| RAG cache never refreshed | After editing a blog, the chatbot answered from the old text | Chunks are versioned by `updatedAt` and rebuilt on edit |
| Blog HTML rendered with `dangerouslySetInnerHTML` unsanitized | Stored XSS: a post could run JavaScript in every reader's browser | `sanitize-html` on save + DOMPurify when rendering |
| CORS `origin: true` with credentials | Any website could make logged-in API calls | CORS allowlist + Origin check on POST/PUT/DELETE, `SameSite=Lax` cookie |
| Search queried a non-existent `content` field; raw user text in `$regex` | Search only matched titles; `(` crashed the query with a 500 | Searches title, subtitle and text; input is escaped |
| Every blog list response included all embeddings | Home page downloaded hundreds of numbers per chunk per blog | Chunks moved to their own collection; never sent to the browser |
| Multer disk storage never cleaned up | Every upload left a file in the temp folder | Memory storage, 5 MB limit, images only |
| DB connection errors only logged | Server ran with no database | Exit with a clear error; required env vars checked at boot |
| `npm start` used nodemon; README said `npm run dev` (didn't exist) | Confusing setup, nodemon in production | `start` = node, `dev` = nodemon |
| Login/signup errors showed "Something went wrong" | Users never saw "Invalid credentials" etc. | Server messages shown in toasts |
| Card previews cut raw HTML at N characters | Half-open tags could break card layout | Plain-text excerpts |
| Chat greeting showed `**` literally; Gemini Markdown shown raw | Messy chat bubbles | Bot answers rendered as sanitized Markdown |
| ~14,000 files of root `node_modules` committed | Huge repo, slow clones | Removed, `.gitignore` added |

## Added

- Chat answers include the blog snippets they were based on ("Based on 3 parts of this blog").
- Rate limits: login/signup, chat, AI generation (the old code declared a limiter but never used it).
- Chat input limits (500-character question, last 10 turns of history) and a stricter system prompt.
- Background indexing on create/edit so the first chat answer is fast.
- `/health` endpoint, central error handler, input validation on signup and blog forms.
- Tests: unit tests (RAG helpers, sanitization) and API tests against a real MongoDB with AI/ImageKit faked.
- GitHub Actions CI, `render.yaml` one-click deploy, `.env.example` files, updated README.
- Express serves the React build in production: one service, one URL.
- Removed unused packages (Groq, OpenAI, HuggingFace inference, several LangChain packages).
- Chat panel fits phone screens.
