import sanitizeHtml from "sanitize-html";

// Blog bodies are rendered with dangerouslySetInnerHTML on the frontend, so any
// HTML saved here runs in every reader's browser. Only the tags the Quill
// editor produces are kept; scripts, event handlers and javascript: URLs are dropped.
const BLOG_HTML_OPTIONS = {
  allowedTags: [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s",
    "strike", "blockquote", "pre", "code", "ul", "ol", "li", "a", "span", "img", "hr",
    "sub", "sup", "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    "*": ["class"],
    li: ["data-list", "class"], // Quill 2 marks bullet vs numbered lists this way
    div: ["data-language", "class"], // Quill 2 code blocks
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedClasses: { "*": [/^ql-/] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export const sanitizeBlogHtml = (html = "") => sanitizeHtml(String(html), BLOG_HTML_OPTIONS);

export const stripHtml = (html = "") =>
  sanitizeHtml(String(html), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// User search text goes into a MongoDB $regex; escape it so characters like
// "(" don't throw and patterns like "(a+)+" can't be used to slow the DB down.
export const escapeRegex = (text = "") => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
