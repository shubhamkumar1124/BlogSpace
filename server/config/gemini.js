import "./env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

let genAI = null;
const getClient = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

// Blog draft generation, grounded with Google Search.
async function generateBlogContent(prompt) {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    tools: [{ googleSearch: {} }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Chat answer for the RAG bot. The system instruction carries the rules and
// the retrieved context; history and the question are sent as normal turns.
export async function answerWithContext({ systemInstruction, history, question }) {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
  });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(question);
  return result.response.text();
}

export default generateBlogContent;
