// Small shared helper for talking to Google Gemini.
const { GoogleGenAI } = require("@google/genai");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // change in .env if Google retires it
let client;

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini request timed out")), ms)),
    ]);

// Sends a prompt and returns the answer already parsed as a JavaScript object.
// responseMimeType makes Gemini reply with valid JSON only (no extra text).
async function askGeminiJson(prompt) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    client = client || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await withTimeout(
        client.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        25000
    );
    return JSON.parse(response.text);
}

// Turns review documents into plain numbered text for the prompt.
// We only send the newest 60 reviews, each cut to 400 characters, to keep the prompt small.
function reviewsToText(reviews) {
    return reviews
        .slice(-60)
        .map((r, i) => `${i + 1}. (${r.rating}/5) ${(r.comment || "").slice(0, 400)}`)
        .join("\n");
}

// Makes sure a value from the AI is a clean array of short strings
function toList(value, max = 6) {
    if (!Array.isArray(value)) return [];
    const cleaned = value.map((v) => String(v).trim()).filter(Boolean);
    return [...new Set(cleaned)].slice(0, max);
}

module.exports = { askGeminiJson, reviewsToText, toList };
