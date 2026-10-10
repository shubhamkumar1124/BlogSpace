import DOMPurify from "dompurify";

// Blog HTML comes from users. The server sanitizes it on save; this second
// pass also protects blogs saved before that fix.
export const safeHtml = (html = "") => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

// Plain-text preview for cards. Cutting raw HTML at N characters (as before)
// could leave half-open tags that broke the card layout.
export const toExcerpt = (html = "", max = 120) => {
    const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), "text/html");
    const text = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};
