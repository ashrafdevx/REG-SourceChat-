// Embedding generator using Google Gemini API
// Fallback to mock embeddings if API key is not available (for development)

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let embeddingsModel = null;

async function initEmbeddings() {
  if (embeddingsModel) return embeddingsModel;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Embeddings] GOOGLE_GEMINI_API_KEY not set. Using mock embeddings for development.",
    );
    // Return a mock embeddings object
    embeddingsModel = {
      embedQuery: async (text) => {
        // Mock: return a fixed-size vector (1536 dims for Gemini size)
        const hash = text
          .split("")
          .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1e9, 0);
        const seed = hash % 1e6;
        const arr = new Array(1536);
        for (let i = 0; i < 1536; i++) {
          arr[i] = Math.sin((seed + i) * 0.1) * 0.5 + 0.5;
        }
        return arr;
      },
      embedDocuments: async (texts) => {
        return Promise.all(texts.map((t) => embeddingsModel.embedQuery(t)));
      },
    };
    return embeddingsModel;
  }

  try {
    embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      model: "embedding-001",
    });
    console.log("[Embeddings] Initialized Google Gemini embeddings model");
    return embeddingsModel;
  } catch (err) {
    console.warn("[Embeddings] Failed to initialize Gemini embeddings:", err.message);
    // Fallback to mock
    embeddingsModel = {
      embedQuery: async (text) => {
        const hash = text
          .split("")
          .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1e9, 0);
        const seed = hash % 1e6;
        const arr = new Array(1536);
        for (let i = 0; i < 1536; i++) {
          arr[i] = Math.sin((seed + i) * 0.1) * 0.5 + 0.5;
        }
        return arr;
      },
      embedDocuments: async (texts) => {
        return Promise.all(texts.map((t) => embeddingsModel.embedQuery(t)));
      },
    };
    return embeddingsModel;
  }
}

export async function generateEmbeddings(texts) {
  const model = await initEmbeddings();
  if (!texts || texts.length === 0) return [];

  try {
    const embeddings = await model.embedDocuments(texts);
    return embeddings;
  } catch (err) {
    console.error("[Embeddings] Error generating embeddings:", err.message);
    throw err;
  }
}

export async function generateEmbedding(text) {
  const model = await initEmbeddings();
  if (!text) return null;

  try {
    const embedding = await model.embedQuery(text);
    return embedding;
  } catch (err) {
    console.error("[Embeddings] Error generating embedding:", err.message);
    throw err;
  }
}

export default {
  generateEmbeddings,
  generateEmbedding,
};
