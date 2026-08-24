import "dotenv/config";
import express from "express";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// Initialize Multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});

app.use(express.json());

// Lazy initialization for Gemini client
let ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[GEMINI_CONFIG_ERROR] GEMINI_API_KEY environment variable is not defined");
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
};

// Health check endpoint
app.get("/api/health/gemini", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  console.log(`[API_INVOCATION] GET /api/health/gemini - hasGeminiKey: ${hasKey}`);

  if (hasKey) {
    return res.status(200).json({ status: "ok", message: "Gemini API configurada" });
  } else {
    console.warn("[GEMINI_WARN] Health check failed: GEMINI_API_KEY is not set");
    return res.status(503).json({ error: "Gemini API no configurada" });
  }
});

// Route for parsing tasting event PDFs / Images via Gemini
app.post("/api/parse-cata", upload.single("file"), async (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  console.log(`[API_INVOCATION] POST /api/parse-cata - hasGeminiKey: ${hasKey}, hasFile: ${Boolean(req.file)}`);

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo para procesar." });
    }

    if (!hasKey) {
      console.error("[GEMINI_CONFIG_ERROR] Cannot parse cata because GEMINI_API_KEY is missing");
      return res.status(503).json({ error: "Servicio de IA no disponible: GEMINI_API_KEY no configurada." });
    }

    const aiClient = getAi();
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const base64Data = fileBuffer.toString("base64");

    // Exact schema matching CataActivity
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
              notes: { type: Type.STRING },
            },
          },
        },
        bodegaProductor: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            region: { type: Type.STRING },
            colaboradores: { type: Type.STRING },
          },
        },
        sumiller: { type: Type.STRING },
        aove: { type: Type.STRING },
        cataType: { type: Type.STRING, description: "Must be 'bodega_unica' or 'varias_bodegas'" },
        tallerEspecial: { type: Type.STRING },
        pairingMenu: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dish: { type: Type.STRING },
              pairing: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
          },
        },
      },
      required: ["type", "category", "title", "date", "time", "location", "price", "spots", "status", "cataType"],
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

    const jsonStr = response.text?.trim() || "{}";
    const parsedData = JSON.parse(jsonStr);

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("[GEMINI_API_ERROR] Error in POST /api/parse-cata:", error?.message || error);
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
    const errorMessage = is503
      ? "El modelo de Inteligencia Artificial está experimentando alta demanda en este momento. Por favor, inténtalo de nuevo en unos segundos."
      : error?.message || "Error al procesar el documento con la IA.";

    return res.status(is503 ? 503 : 500).json({ error: errorMessage });
  }
});

// Catch-all for API routes to prevent falling through to SPA fallback
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

export default app;
