import "./env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Two LLM providers are supported:
// - Groq (used when GROQ_API_KEY is set): free tier, OpenAI-compatible API
// - Google Gemini (used otherwise)
export const AI_PROVIDER = process.env.GROQ_API_KEY ? "groq" : "gemini";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// ---- Groq -------------------------------------------------------------------
const groqChat = async (messages, maxTokens) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      max_completion_tokens: maxTokens,
      // gpt-oss models "think" first; keep that short and out of the answer.
      ...(GROQ_MODEL.startsWith("openai/gpt-oss") && { reasoning_effort: "low", include_reasoning: false }),
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${data?.error?.message || res.statusText}`);
  }
  return data.choices?.[0]?.message?.content || "";
};

// ---- Gemini -----------------------------------------------------------------
let genAI = null;
const getGemini = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

// Blog draft generation (Gemini also grounds it with Google Search).
async function generateBlogContent(prompt) {
  if (AI_PROVIDER === "groq") {
    return groqChat([{ role: "user", content: prompt }], 3000);
  }
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    tools: [{ googleSearch: {} }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Chat answer for the RAG bot. The system instruction carries the rules and
// the retrieved context; history (Gemini format) and the question are sent as turns.
export async function answerWithContext({ systemInstruction, history, question }) {
  if (AI_PROVIDER === "groq") {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.parts.map((p) => p.text).join("\n"),
      })),
      { role: "user", content: question },
    ];
    return groqChat(messages, 1024);
  }
  const model = getGemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
  });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(question);
  return result.response.text();
}

export default generateBlogContent;
