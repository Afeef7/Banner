import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

let aiClient: GoogleGenAI | null = null;

/**
 * Returns the securely initialized GoogleGenAI client instance.
 * Throws a clear server-side error if GEMINI_API_KEY is missing,
 * preventing silent failures while avoiding application crashes on startup.
 */
export function getGeminiClient(): GoogleGenAI {
  if (aiClient) {
    return aiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Service] CRITICAL ERROR: GEMINI_API_KEY is not defined in the environment!");
    throw new Error(
      "Gemini API key is missing. Please configure GEMINI_API_KEY in your server environment variables or Settings > Secrets."
    );
  }

  // Safely log the presence and masked representation of the API key
  const maskedKey = apiKey.length > 8
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : "***";
  console.log(`[Gemini Service] Initializing GoogleGenAI client with key: ${maskedKey}`);

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  return aiClient;
}
