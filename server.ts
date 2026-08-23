import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Initialize Multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini SDK lazily
let ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
};

app.use(express.json());

// Gemini API Health Check Route
app.get("/api/health/gemini", (req, res) => {
  if (process.env.GEMINI_API_KEY) {
    return res.json({ status: "ok", message: "Gemini API configurada" });
  } else {
    return res.status(503).json({ error: "Gemini API no configurada" });
  }
});

// API Route for Parsing PDFs / Images via Gemini
app.post("/api/parse-cata", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const aiClient = getAi();
    
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const base64Data = fileBuffer.toString("base64");

    // Set up the exact schema that matches CataActivity from frontend
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING, description: "Must be 'cata'" },
        category: { type: Type.STRING, description: "Must be 'cata'" },
        title: { type: Type.STRING },
        date: { type: Type.STRING },
        time: { type: Type.STRING },
        location: { type: Type.STRING },
        price: { type: Type.NUMBER },
        nonMemberPrice: { type: Type.NUMBER },
        spots: { type: Type.NUMBER },
        imageUrl: { type: Type.STRING, description: "Empty string" },
        status: { type: Type.STRING, description: "Must be 'open'" },
        description: { type: Type.STRING, description: "Empty string" },
        rawText: { type: Type.STRING, description: "Empty string" },
        wines: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Blanco, Tinto, Vermut, Pase I, etc." },
              name: { type: Type.STRING },
              bodega: { type: Type.STRING },
              region: { type: Type.STRING },
              denominacion: { type: Type.STRING },
              grape: { type: Type.STRING },
              pairing: { type: Type.STRING },
              notes: { type: Type.STRING }
            }
          }
        },
        bodegaProductor: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            region: { type: Type.STRING },
            colaboradores: { type: Type.STRING }
          }
        },
        sumiller: { type: Type.STRING },
        aove: { type: Type.STRING },
        cataType: { type: Type.STRING, description: "Must be 'bodega_unica' or 'varias_bodegas'" },
        tallerEspecial: { type: Type.STRING },
        pairingMenu: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { dish: { type: Type.STRING }, pairing: { type: Type.STRING }, notes: { type: Type.STRING } } } }
      },
      required: ["type", "category", "title", "date", "time", "location", "price", "spots", "status", "cataType"]
    };

    const prompt = `You are an expert sommelier and data extraction assistant. Analyze the provided promotional poster or document for a wine/vermouth tasting (cata).
Extract the details into the provided JSON schema. Pay special attention to whether it's a single winery (bodega_unica) or multiple wineries/passes (varias_bodegas).
If it's 'varias_bodegas', ensure each wine in the 'wines' array captures its specific 'bodega', 'region', 'grape', and 'pairing'.
If there's a special workshop or hands-on activity (like "Vas a hacer tu propio vermut"), put it in 'tallerEspecial'.
If there's a welcome EVOO (AOVE), put it in 'aove'.
If the year is not explicitly present, assume it is 2026.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    let jsonStr = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonStr);

    // Return the parsed data
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error parsing cata:", error);
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand');
    const errorMessage = is503 
      ? "El modelo de Inteligencia Artificial está experimentando alta demanda en este momento. Por favor, inténtalo de nuevo en unos segundos."
      : error.message || "Failed to parse document via AI.";
    res.status(is503 ? 503 : 500).json({ error: errorMessage });
  }
});

// Catch-all for API routes to prevent falling through to SPA fallback
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Export the app for Vercel Serverless Functions
export default app;

// Start dev server if not in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  async function startDevServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*all", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startDevServer();
}
