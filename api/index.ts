import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// Model configuration - configurable via environment variables with robust defaults
const GEMINI_MODEL_PRIMARY = process.env.GEMINI_MODEL_PRIMARY || "gemini-3.7-flash";
const GEMINI_MODEL_FALLBACK = process.env.GEMINI_MODEL_FALLBACK || "gemini-3.6-flash";

// Helper function to generate content with single-retry fallback on 503/high-demand errors
async function generateContentWithFallback(aiClient: GoogleGenAI, params: any) {
  try {
    const response = await aiClient.models.generateContent({
      ...params,
      model: GEMINI_MODEL_PRIMARY,
    });
    console.log(`[GEMINI_MODEL_USED] used=${GEMINI_MODEL_PRIMARY}`);
    return response;
  } catch (error: any) {
    const errorMsg = String(error?.message || "");
    const is503 =
      error?.status === 503 ||
      error?.code === 503 ||
      errorMsg.includes("503") ||
      errorMsg.toLowerCase().includes("high demand") ||
      errorMsg.includes("UNAVAILABLE");

    if (is503) {
      console.warn(
        `[GEMINI_FALLBACK_TRIGGERED] Primary model (${GEMINI_MODEL_PRIMARY}) failed with 503/high demand: "${errorMsg}". Retrying once with fallback (${GEMINI_MODEL_FALLBACK})...`
      );
      const fallbackResponse = await aiClient.models.generateContent({
        ...params,
        model: GEMINI_MODEL_FALLBACK,
      });
      console.log(
        `[GEMINI_MODEL_USED] primary=${GEMINI_MODEL_PRIMARY} used=${GEMINI_MODEL_FALLBACK} (fallback activado)`
      );
      return fallbackResponse;
    }

    // Any other error is thrown directly without triggering fallback
    throw error;
  }
}

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

// Function to read the personality prompt markdown file
function getPromptPersonality(): string {
  try {
    const candidates = [
      path.join(process.cwd(), "api", "prompts", "analista_catas.md"),
      path.join(__dirname, "prompts", "analista_catas.md"),
      path.join(__dirname, "..", "api", "prompts", "analista_catas.md"),
    ];
    for (const promptPath of candidates) {
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, "utf-8");
      }
    }
  } catch (err) {
    console.warn("[PROMPT_LOAD_WARN] Could not read /api/prompts/analista_catas.md, using default personality", err);
  }

  return `Eres un sumiller profesional de alta gastronomía, experto en marketing enológico y analista especializado en carteles y documentos promocionales de catas de vino y vermut para la Asociación Cultural Gastronómica "Doña Berenjena". Analiza el documento y extrae todos los datos estructurados en formato JSON.`;
}

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

    // Clean schema: INFO DE LA CATA + ARRAY DE BODEGAS (con 1 a 4 vinos cada una)
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING, description: "Must be 'cata'" },
        category: { type: Type.STRING, description: "Must be 'vino', 'vermut', 'cerveza', 'aceite', or 'quesos'" },
        title: { type: Type.STRING, description: "Main title of the tasting event, placed immediately after the location header" },
        subtitle: { type: Type.STRING, description: "Explicit subtitle under title or generated marketing subtitle" },
        description: { type: Type.STRING, description: "Enological marketing description. If there is an in-situ workshop (e.g. make your own vermouth or gildas) or special guest winemakers/restaurateurs, include it described here." },
        date: { type: Type.STRING, description: "First date ISO YYYY-MM-DD" },
        date2: { type: Type.STRING, description: "Second date ISO YYYY-MM-DD if event has 2 dates" },
        time: { type: Type.STRING, description: "Start time for first shift e.g. 21:00 or 13:00" },
        time2: { type: Type.STRING, description: "Start time for second shift e.g. 21:00 or 13:00" },
        location: { type: Type.STRING, description: "Location, default: Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava" },
        price: { type: Type.NUMBER, description: "Standard price in euros (default 25)" },
        spots: { type: Type.NUMBER, description: "Total spots (default 14)" },
        status: { type: Type.STRING, description: "proxima" },
        sumiller: { type: Type.STRING, description: "Sommelier guide, e.g. Ana García" },
        aove: { type: Type.STRING, description: "Welcome EVOO (AOVE), e.g. Quinto Don Otilio (Bolaños de Calatrava – Ciudad Real) - AOVE Picual" },
        bodegas: {
          type: Type.ARRAY,
          description: "List of 1 to 4 participating wineries",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the winery / producer" },
              website: { type: Type.STRING, description: "Official website URL of the winery if known" },
              region: { type: Type.STRING, description: "Location / Region / D.O." },
              wines: {
                type: Type.ARRAY,
                description: "1 to 4 wines/vermouths for this winery",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Type / Pass: Blanco, Rosado, Tinto, Espumoso, Vino de Licor, Vermut, Pase I, Pase II..." },
                    name: { type: Type.STRING, description: "Commercial name of the wine or vermouth" },
                    grape: { type: Type.STRING, description: "Grape variety e.g. 100 % Airén, Pedro Ximénez – Palomino" },
                    pairing: { type: Type.STRING, description: "Paired dish or bite" },
                    notes: { type: Type.STRING, description: "Additional tasting notes" },
                  },
                  required: ["type", "name"],
                },
              },
            },
            required: ["name", "region", "wines"],
          },
        },
      },
      required: ["type", "category", "title", "date", "time", "location", "price", "spots", "status", "bodegas"],
    };

    const personalityPrompt = getPromptPersonality();

    const response = await generateContentWithFallback(aiClient, {
      contents: [
        {
          text: personalityPrompt,
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

    // Clean and validate time formats (strictly HH:MM)
    const cleanTime = (t: string | undefined): string => {
      if (!t) return "";
      const match = t.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
      return "";
    };

    parsedData.time = cleanTime(parsedData.time) || "21:00";
    if (parsedData.time2) {
      parsedData.time2 = cleanTime(parsedData.time2) || "13:00";
    }

    // Ensure subtitle and description are never empty
    if (!parsedData.subtitle || parsedData.subtitle.trim().length === 0) {
      parsedData.subtitle = "Un viaje sensorial por la tradición y el terruño";
    }

    if (!parsedData.description || parsedData.description.trim().length === 0) {
      const bodegaNames = (parsedData.bodegas || [])
        .map((b: any) => b.name)
        .filter(Boolean)
        .join(", ");
      parsedData.description = `Disfruta de una velada enogastronómica única en nuestra Sala de Catas con la selección especial de ${bodegaNames || "nuestras bodegas invitadas"}. Guiados por nuestra sumiller ${parsedData.sumiller || "Ana García"}, exploraremos una cuidada armonización de vinos y maridajes artesanos.`;
    }

    // Apply defaults & safety adjustments
    if (!parsedData.price || isNaN(Number(parsedData.price))) parsedData.price = 25.0;
    else parsedData.price = Number(Number(parsedData.price).toFixed(2));
    if (!parsedData.spots) parsedData.spots = 14;
    if (!parsedData.status) parsedData.status = "proxima";
    if (!parsedData.location) parsedData.location = "Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava";
    if (!parsedData.sumiller) parsedData.sumiller = "Ana García";

    // Ensure bodegas array exists and has at least one default if empty
    if (!parsedData.bodegas || !Array.isArray(parsedData.bodegas) || parsedData.bodegas.length === 0) {
      parsedData.bodegas = [
        {
          name: "Bodega Invitada",
          region: "Castilla-La Mancha",
          website: "",
          wines: [
            { type: "Blanco", name: "", grape: "", pairing: "" },
            { type: "Tinto", name: "", grape: "", pairing: "" }
          ]
        }
      ];
    } else {
      // Clean and validate bodega websites (if not a real URL starting with http, leave empty)
      parsedData.bodegas.forEach((b: any) => {
        if (b.website) {
          const web = String(b.website).trim();
          if (!/^https?:\/\/[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}/i.test(web)) {
            b.website = "";
          }
        } else {
          b.website = "";
        }
      });
    }

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
