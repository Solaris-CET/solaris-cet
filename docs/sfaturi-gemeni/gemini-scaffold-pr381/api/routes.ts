import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Gemini AI lazily to avoid crashing if key is missing on startup
let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Secure proxy for Gemini AI content generation
router.post("/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-3-flash-preview" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    res.status(500).json({ 
      error: "Failed to generate content",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
