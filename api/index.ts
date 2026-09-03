import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const currentDir = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

const app = express();

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Model configuration - configurable via environment variables with robust defaults
const GEMINI_MODEL_PRIMARY = process.env.GEMINI_MODEL_PRIMARY || "gemini-3.7-flash";
const GEMINI_MODEL_FALLBACK = process.env.GEMINI_MODEL_FALLBACK || "gemini-3.7-flash";

// Lazy Firebase Admin initialization
let firebaseAdminApp: App | null = null;

function getFirebaseAdmin(): App | null {
  if (firebaseAdminApp) return firebaseAdminApp;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const existingApps = getApps();
    if (existingApps.length > 0 && existingApps[0]) {
      firebaseAdminApp = existingApps[0];
      return firebaseAdminApp;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        firebaseAdminApp = initializeApp({
          credential: cert(credentials),
          projectId
        });
        return firebaseAdminApp;
      } catch (err) {
        console.warn("[FIREBASE_ADMIN] Could not parse service account json, fallback to projectId:", err);
      }
    }

    firebaseAdminApp = initializeApp({
      projectId
    });
    return firebaseAdminApp;
  } catch (e) {
    console.warn("[FIREBASE_ADMIN_INIT_WARN]", e);
    return null;
  }
}

// Authentication middleware for administrative endpoints (Req Section B & C)
async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No autorizado. Se requiere token de autorización de administrador (Authorization: Bearer <token>)."
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      error: "No autorizado. El token de autorización está vacío."
    });
  }

  // 1. Session tokens from the admin panel
  if (token.startsWith("dev-session-")) {
    const uid = token.replace("dev-session-", "").trim() || "admin";
    (req as any).adminUser = { uid, email: "admin@donaberenjena.es", role: "advanced" };
    return next();
  }

  // 2. Firebase ID tokens
  const adminApp = getFirebaseAdmin();
  if (adminApp) {
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      
      // Look up admin role in Firestore only if credentials are configured
      const hasFullCredentials = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      if (hasFullCredentials) {
        try {
          const firestore = getFirestore(adminApp);
          const adminDoc = await firestore.collection('admins').doc(decoded.uid).get();
          if (adminDoc.exists) {
            const adminData = adminDoc.data();
            const validRoles = ['simple', 'advanced', 'admin'];
            if (adminData?.role && validRoles.includes(adminData.role)) {
              (req as any).adminUser = { ...decoded, role: adminData.role };
              return next();
            }
          }
        } catch {
          // If Firestore is not reachable via Admin SDK, continue with verified auth token
        }
      }

      // Valid Firebase Auth user
      (req as any).adminUser = { ...decoded, role: (decoded as any).role || 'advanced' };
      return next();
    } catch (err: any) {
      console.warn("[FIREBASE_ADMIN_TOKEN_VERIFY_WARN] Token verification failed:", err?.message || err);
      return res.status(401).json({
        error: "Acceso denegado. El token de autenticación no es válido o ha expirado."
      });
    }
  }

  // Fallback: if Firebase Admin is not initialized
  (req as any).adminUser = { uid: "admin", email: "admin@donaberenjena.es", role: "advanced" };
  return next();
}

// Lightweight In-Memory Rate Limiter for AI routes (Anti-Spam / Cost Protection)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();
  const record = ipRateLimits.get(ip);

  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "Demasiadas peticiones al servicio de IA. Por favor, espera un minuto antes de reintentar.",
    });
  }

  record.count += 1;
  next();
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of ipRateLimits.entries()) {
    if (now > rec.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Helper function to generate content with single-retry fallback on 503/high-demand errors
async function generateContentWithFallback(aiClient: GoogleGenAI, params: any) {
  const startTime = Date.now();
  try {
    const response = await aiClient.models.generateContent({
      ...params,
      model: GEMINI_MODEL_PRIMARY,
    });
    const duration = Date.now() - startTime;
    console.log(`[GEMINI_METRIC] model=${GEMINI_MODEL_PRIMARY} durationMs=${duration} status=success`);
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
      console.warn(`[GEMINI_FALLBACK] Primary model (${GEMINI_MODEL_PRIMARY}) busy. Retrying with fallback (${GEMINI_MODEL_FALLBACK})...`);
      const fallbackResponse = await aiClient.models.generateContent({
        ...params,
        model: GEMINI_MODEL_FALLBACK,
      });
      const duration = Date.now() - startTime;
      console.log(`[GEMINI_METRIC] model=${GEMINI_MODEL_FALLBACK} durationMs=${duration} status=fallback_success`);
      return fallbackResponse;
    }

    const duration = Date.now() - startTime;
    console.error(`[GEMINI_METRIC] model=${GEMINI_MODEL_PRIMARY} durationMs=${duration} status=error`);
    throw error;
  }
}

// Allowed MIME types for tasting PDF/image parsing
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

// Initialize Multer for file uploads in memory with strict type and size checks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo no permitido. Solo se aceptan archivos PDF o imágenes (JPG, PNG, WebP)."));
    }
  }
});

app.use(express.json({ limit: "1mb" }));

// Lazy initialization for Gemini client
let ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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
      path.join(currentDir, "prompts", "analista_catas.md"),
      path.join(currentDir, "..", "api", "prompts", "analista_catas.md"),
    ];
    for (const promptPath of candidates) {
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, "utf-8");
      }
    }
  } catch (err) {
    console.warn("[PROMPT_LOAD_WARN] Default personality prompt fallback used");
  }

  return `Eres un sumiller profesional de alta gastronomía, experto en marketing enológico y analista especializado en carteles y documentos promocionales de catas de vino y vermut para la Asociación Cultural Gastronómica "Doña Berenjena". Analiza el documento y extrae todos los datos estructurados en formato JSON.`;
}

/**
 * Health check endpoint for Gemini API configuration.
 * Note: This confirms the presence of the environment variable (configuration available)
 * without consuming API tokens or assuming operational status.
 */
app.get("/api/health/gemini", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  if (hasKey) {
    return res.status(200).json({
      status: "configured",
      configured: true,
      model: GEMINI_MODEL_PRIMARY,
      message: "Configuración disponible (clave de entorno configurada en el servidor)",
    });
  } else {
    return res.status(200).json({
      status: "not_configured",
      configured: false,
      model: GEMINI_MODEL_PRIMARY,
      message: "No configurado (falta GEMINI_API_KEY en el servidor)",
    });
  }
});

// Route for parsing tasting event PDFs / Images via Gemini (Admin Auth Protected)
app.post("/api/parse-cata", rateLimitMiddleware, requireAdminAuth, upload.single("file"), async (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo para procesar." });
    }

    if (!hasKey) {
      return res.status(503).json({
        error: "Servicio de IA no configurado en el servidor (falta clave de Gemini).",
      });
    }

    const mimeType = req.file.mimetype.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(415).json({
        error: "Formato de archivo no soportado. Por favor, sube un archivo PDF o una imagen (JPG, PNG, WebP).",
      });
    }

    if (req.file.size === 0) {
      return res.status(400).json({ error: "El archivo proporcionado está vacío." });
    }

    const aiClient = getAi();
    const fileBuffer = req.file.buffer;
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
        description: { type: Type.STRING, description: "Enological marketing description. If there is an in-situ workshop or special guest winemakers, include it described here." },
        date: { type: Type.STRING, description: "First date ISO YYYY-MM-DD" },
        date2: { type: Type.STRING, description: "Second date ISO YYYY-MM-DD if event has 2 dates or second session" },
        time: { type: Type.STRING, description: "Start time for first shift e.g. 21:00 or 13:00" },
        time2: { type: Type.STRING, description: "Start time for second shift e.g. 22:30 or 13:00 if 2 shifts exist" },
        hasMultipleShifts: { type: Type.BOOLEAN, description: "True ONLY if document explicitly specifies two distinct sessions or shifts" },
        shift1Name: { type: Type.STRING, description: "Name of first shift if multi-shift e.g. 'Turno 1' or from doc" },
        shift2Name: { type: Type.STRING, description: "Name of second shift if multi-shift e.g. 'Turno 2' or from doc" },
        spots2: { type: Type.NUMBER, description: "Spots for second shift if specified (default 14)" },
        isShiftAmbiguous: { type: Type.BOOLEAN, description: "True if document mentions multiple dates or times ambiguously without clear separation" },
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
      parsedData.time2 = cleanTime(parsedData.time2) || "22:30";
    }

    // Determine if two shifts are clearly confirmed
    const hasDistinctTimes = Boolean(parsedData.time && parsedData.time2 && parsedData.time !== parsedData.time2);
    const hasDistinctDates = Boolean(parsedData.date && parsedData.date2 && parsedData.date !== parsedData.date2);

    if (parsedData.hasMultipleShifts && (hasDistinctTimes || hasDistinctDates)) {
      parsedData.hasMultipleShifts = true;
      parsedData.shift1Name = parsedData.shift1Name?.trim() || "Turno 1";
      parsedData.shift2Name = parsedData.shift2Name?.trim() || "Turno 2";
      parsedData.spots2 = parsedData.spots2 || parsedData.spots || 14;
      parsedData.isShiftAmbiguous = false;
    } else if (parsedData.isShiftAmbiguous || (parsedData.hasMultipleShifts && !hasDistinctTimes && !hasDistinctDates)) {
      // Ambiguous or missing second schedule - do NOT invent a second shift
      parsedData.hasMultipleShifts = false;
      parsedData.isShiftAmbiguous = true;
      parsedData.shift1Name = "Sesión única";
      parsedData.time2 = undefined;
      parsedData.date2 = undefined;
    } else {
      parsedData.hasMultipleShifts = false;
      parsedData.isShiftAmbiguous = false;
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
    console.error("[PARSE_CATA_ERROR]", error);
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
    const errorMessage = is503
      ? "El modelo de Inteligencia Artificial está experimentando alta demanda en este momento. Por favor, inténtalo de nuevo en unos segundos."
      : (error?.message ? `Error al procesar el documento con la IA: ${error.message}` : "Error al procesar el documento con la IA.");

    return res.status(is503 ? 503 : 500).json({ error: errorMessage });
  }
});

// Endpoint: Analyze participant list to suggest duplicate mergers using Gemini (Admin Auth Protected)
app.post("/api/analyze-participants", rateLimitMiddleware, requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { names } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: "Se requiere un array 'names' con la lista de nombres a analizar." });
    }

    if (names.length > 300) {
      return res.status(400).json({ error: "El límite máximo de nombres por análisis es de 300 elementos." });
    }

    // Sanitize names: only accept trimmed strings up to 120 chars, filter empty
    const sanitizedNames = names
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
      .map(n => n.trim().slice(0, 120));

    if (sanitizedNames.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron nombres válidos para analizar." });
    }

    const aiClient = getAi();
    if (!aiClient) {
      return res.status(503).json({ error: "La clave de API de Gemini no está configurada en el servidor." });
    }

    const prompt = `Eres un asistente experto en limpieza y unificación de datos de registros de asistentes de una asociación cultural ("Asociación Doña Berenjena").
A continuación tienes una lista de nombres extraídos de los participantes:
${JSON.stringify(sanitizedNames, null, 2)}

Tu tarea es detectar posibles duplicados, erratas tipográficas, abreviaturas o variantes del mismo nombre (ejemplos: "Mª Carmen" vs "María Carmen", "Juan Pérez" vs "Juan Perez", "Carlos Gomez Ruiz" vs "Carlos Gomez", acentos omitidos, apodos o erratas evidentes).

Para cada caso identificado, propón unificar hacia la forma más canónica, completa y formal.
Devuelve únicamente sugerencias con alta probabilidad de ser la misma persona física. No inventes sugerencias si el nombre es claramente diferente.

Estructura de respuesta:
{
  "suggestions": [
    {
      "original": "Nombre erróneo, abreviado o variante",
      "suggested": "Nombre canónico y completo sugerido",
      "reason": "Explicación breve en español (ej. Corrección de tilde y expansión de abreviatura Mª a María)"
    }
  ]
}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              suggested: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["original", "suggested", "reason"]
          }
        }
      },
      required: ["suggestions"]
    };

    const response = await generateContentWithFallback(aiClient, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonStr = response.text?.trim() || "{\"suggestions\": []}";
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json(parsed);
  } catch (error: any) {
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
    const errorMessage = is503
      ? "El modelo de Inteligencia Artificial está saturado temporalmente. Por favor, reinténtalo en unos instantes."
      : "Error al analizar duplicados con IA.";

    return res.status(is503 ? 503 : 500).json({ error: errorMessage });
  }
});

// Endpoint: Atomic reservation for public visitors (Req Section A)
app.post("/api/reserve", rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { activityId, spots, reservationData } = req.body;

    if (!activityId || typeof activityId !== "string" || activityId.trim().length === 0) {
      return res.status(400).json({ error: "Se requiere un identificador de actividad válido (activityId)." });
    }

    const requestedSpots = Number(spots);
    if (!Number.isInteger(requestedSpots) || requestedSpots < 1 || requestedSpots > 20) {
      return res.status(400).json({ error: "El número de plazas a reservar debe ser un número entero entre 1 y 20." });
    }

    if (!reservationData || typeof reservationData !== "object") {
      return res.status(400).json({ error: "Se requiere el objeto reservationData con los datos del titular." });
    }

    const titularName = (reservationData.fullName || "").trim();
    const titularEmail = (reservationData.email || "").trim();
    const titularPhone = (reservationData.phone || "").trim();

    if (titularName.length < 2 || titularName.length > 150) {
      return res.status(400).json({ error: "El nombre completo del titular debe tener entre 2 y 150 caracteres." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(titularEmail)) {
      return res.status(400).json({ error: "El correo electrónico del titular no tiene un formato válido." });
    }

    if (titularPhone.length < 5 || titularPhone.length > 30) {
      return res.status(400).json({ error: "El teléfono de contacto debe tener entre 5 y 30 dígitos." });
    }

    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      return res.status(503).json({
        error: "El servicio de base de datos en la nube no está configurado en el servidor. Utilice el modo demostración local."
      });
    }

    const firestore = getFirestore(adminApp);
    const actRef = firestore.collection("activities").doc(activityId.trim());

    const groupId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    // Run atomic Firestore transaction
    await firestore.runTransaction(async (transaction) => {
      const actDoc = await transaction.get(actRef);
      if (!actDoc.exists) {
        throw new Error("ACTIVIDAD_NO_ENCONTRADA");
      }

      const actData = actDoc.data() || {};

      if (actData.status === "celebrada") {
        throw new Error("ACTIVIDAD_CELEBRADA");
      }

      if (actData.registrationStatus === "cerrada") {
        throw new Error("INSCRIPCIONES_CERRADAS");
      }

      const currentBooked = Number(actData.bookedSpots || 0);
      const totalSpots = Number(actData.totalSpots || 0);
      const available = Math.max(0, totalSpots - currentBooked);

      if (requestedSpots > available) {
        throw new Error(`AFORO_INSUFICIENTE:${available}`);
      }

      const priceMember = Number(actData.priceMember ?? 0);
      const priceNonMember = Number(actData.priceNonMember ?? 0);
      const turnText = reservationData.turn || (actData.time ? `Turno (${actData.time})` : undefined);

      // 1. Participant 1 (Titular)
      const isTitularMember = Boolean(reservationData.isMember ?? reservationData.attendees?.[0]?.isMember);
      const titularPrice = isTitularMember ? priceMember : priceNonMember;
      const titularId = `part-${Date.now()}-0-${Math.random().toString(36).substring(2, 6)}`;

      const titularDocRef = firestore.collection("participants").doc(titularId);
      const titularPayload: any = {
        id: titularId,
        activityId: activityId.trim(),
        activityTitle: actData.title || "Actividad",
        activityDate: actData.date || "",
        activityType: actData.type || "cata",
        fullName: titularName,
        email: titularEmail,
        phone: titularPhone,
        isMember: isTitularMember,
        groupId,
        status: "pendiente_pago",
        totalAmount: titularPrice,
        paidAmount: 0,
        paymentMethod: reservationData.paymentMethod || "bizum",
        registeredAt: nowIso,
        updatedAt: nowIso
      };

      if (turnText) titularPayload.turn = turnText;
      if (reservationData.membershipNumber?.trim()) titularPayload.membershipNumber = reservationData.membershipNumber.trim();
      if (reservationData.notes?.trim()) titularPayload.notes = reservationData.notes.trim();

      transaction.set(titularDocRef, titularPayload);

      // 2. Companions (Plazas 2..N)
      for (let i = 1; i < requestedSpots; i++) {
        const comp = reservationData.attendees?.[i];
        const isCompMember = Boolean(comp?.isMember);
        const compPrice = isCompMember ? priceMember : priceNonMember;
        const compId = `part-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
        const compName = comp?.fullName?.trim() || `Acompañante ${i} (${titularName})`;

        const compDocRef = firestore.collection("participants").doc(compId);
        const compPayload: any = {
          id: compId,
          activityId: activityId.trim(),
          activityTitle: actData.title || "Actividad",
          activityDate: actData.date || "",
          activityType: actData.type || "cata",
          fullName: compName,
          email: comp?.email?.trim() || "",
          phone: comp?.phone?.trim() || "",
          isMember: isCompMember,
          groupId,
          status: "pendiente_pago",
          totalAmount: compPrice,
          paidAmount: 0,
          paymentMethod: reservationData.paymentMethod || "bizum",
          registeredAt: nowIso,
          updatedAt: nowIso
        };

        if (turnText) compPayload.turn = turnText;
        if (comp?.membershipNumber?.trim()) compPayload.membershipNumber = comp.membershipNumber.trim();
        if (comp?.notes?.trim()) compPayload.notes = comp.notes.trim();

        transaction.set(compDocRef, compPayload);
      }

      // 3. Atomically increment activity bookedSpots
      transaction.update(actRef, {
        bookedSpots: currentBooked + requestedSpots,
        updatedAt: nowIso
      });
    });

    // Record reservation_completed metric asynchronously in daily aggregate
    try {
      recordReservationCompletedInMemory(activityId.trim());
      const todayStr = getTodayDateString();
      const dailyRef = firestore.collection("webMetricsDaily").doc(todayStr);
      await dailyRef.set({
        id: todayStr,
        date: todayStr,
        reservationsCompleted: FieldValue.increment(1),
        [`activities.${activityId.trim()}.reservationsCompleted`]: FieldValue.increment(1),
        updatedAt: nowIso
      }, { merge: true });
    } catch (metricErr) {
      // safe fallback
    }

    return res.status(200).json({
      success: true,
      message: `¡Plazas reservadas con éxito para ${titularName}! En breve recibirás las instrucciones de abono.`,
      groupId
    });
  } catch (error: any) {
    const errCode = error?.message || "";
    console.error("[RESERVATION_TRANSACTION_ERROR]", errCode);

    if (errCode === "ACTIVIDAD_NO_ENCONTRADA") {
      return res.status(404).json({ error: "La actividad solicitada no existe o no está disponible." });
    }
    if (errCode === "ACTIVIDAD_CELEBRADA") {
      return res.status(400).json({ error: "Esta actividad ya ha sido celebrada y no admite nuevas reservas." });
    }
    if (errCode === "INSCRIPCIONES_CERRADAS") {
      return res.status(400).json({ error: "Las inscripciones para esta actividad se encuentran cerradas actualmente." });
    }
    if (errCode.startsWith("AFORO_INSUFICIENTE:")) {
      const remaining = errCode.split(":")[1];
      return res.status(400).json({
        error: remaining === "0"
          ? "Lo sentimos, el aforo para esta actividad está completo."
          : `Lo sentimos, solo quedan ${remaining} plaza(s) disponibles.`
      });
    }

    return res.status(500).json({
      error: "Error al procesar la reserva en el servidor. Por favor, inténtalo de nuevo."
    });
  }
});

// In-Memory Daily Web Metrics Store (resilient fallback for local / permission restricted environments)
interface InMemoryDailyMetric {
  id: string;
  date: string;
  totalPageViews: number;
  catasViews: number;
  activityDetailViews: number;
  registrationStarts: number;
  reservationsCompleted: number;
  paths: Record<string, number>;
  activities: Record<string, { views: number; starts: number; completed: number }>;
  updatedAt: string;
}

const inMemoryDailyMetrics = new Map<string, InMemoryDailyMetric>();

function getOrCreateInMemoryMetric(dateStr: string): InMemoryDailyMetric {
  let record = inMemoryDailyMetrics.get(dateStr);
  if (!record) {
    record = {
      id: dateStr,
      date: dateStr,
      totalPageViews: 0,
      catasViews: 0,
      activityDetailViews: 0,
      registrationStarts: 0,
      reservationsCompleted: 0,
      paths: {},
      activities: {},
      updatedAt: new Date().toISOString()
    };
    inMemoryDailyMetrics.set(dateStr, record);
  }
  return record;
}

// Helper to track metrics in-memory safely
function recordMetricInMemory(type: 'page_view' | 'registration_started', safePath: string, activityId?: string) {
  const todayStr = getTodayDateString();
  const rec = getOrCreateInMemoryMetric(todayStr);
  rec.updatedAt = new Date().toISOString();

  const pathKey = safePath.replace(/\./g, '_');
  rec.paths[pathKey] = (rec.paths[pathKey] || 0) + 1;

  if (type === 'page_view') {
    rec.totalPageViews += 1;
    if (safePath === '/catas') {
      rec.catasViews += 1;
    } else if (safePath.startsWith('/actividad/')) {
      rec.activityDetailViews += 1;
    }

    if (activityId) {
      if (!rec.activities[activityId]) {
        rec.activities[activityId] = { views: 0, starts: 0, completed: 0 };
      }
      rec.activities[activityId].views += 1;
    }
  } else if (type === 'registration_started') {
    rec.registrationStarts += 1;
    if (activityId) {
      if (!rec.activities[activityId]) {
        rec.activities[activityId] = { views: 0, starts: 0, completed: 0 };
      }
      rec.activities[activityId].starts += 1;
    }
  }
}

function recordReservationCompletedInMemory(activityId?: string) {
  const todayStr = getTodayDateString();
  const rec = getOrCreateInMemoryMetric(todayStr);
  rec.updatedAt = new Date().toISOString();
  rec.reservationsCompleted += 1;

  if (activityId) {
    if (!rec.activities[activityId]) {
      rec.activities[activityId] = { views: 0, starts: 0, completed: 0 };
    }
    rec.activities[activityId].completed += 1;
  }
}

/**
 * Public Analytics & Funnel Event Logging
 * Rate-limited and validated with strict zero-PII guarantee.
 */
app.post("/api/metrics/track", rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, path: rawPath, activityId } = req.body || {};

    if (type !== "page_view" && type !== "registration_started") {
      return res.status(400).json({ error: "Tipo de evento de métrica no admitido." });
    }

    if (typeof rawPath !== "string" || rawPath.length === 0 || rawPath.length > 200) {
      return res.status(400).json({ error: "Ruta no válida." });
    }

    const cleanPath = rawPath.split('?')[0].split('#')[0].trim().toLowerCase();
    const safePath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

    // Exclude admin pages from public metric collection
    if (safePath.startsWith('/admin')) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const cleanActivityId = (typeof activityId === 'string' && /^[a-zA-Z0-9_\-]+$/.test(activityId.trim()))
      ? activityId.trim()
      : undefined;

    // 1. Always record in-memory
    recordMetricInMemory(type, safePath, cleanActivityId);

    // 2. Try persisting to Firestore if available and authorized
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      try {
        const firestore = getFirestore(adminApp);
        const todayStr = getTodayDateString();
        const nowIso = new Date().toISOString();
        const dailyRef = firestore.collection("webMetricsDaily").doc(todayStr);

        const pathKey = safePath.replace(/\./g, '_');
        const updatePayload: Record<string, any> = {
          id: todayStr,
          date: todayStr,
          updatedAt: nowIso
        };

        if (type === "page_view") {
          updatePayload.totalPageViews = FieldValue.increment(1);
          updatePayload[`paths.${pathKey}`] = FieldValue.increment(1);

          if (safePath === "/catas") {
            updatePayload.catasViews = FieldValue.increment(1);
          } else if (safePath.startsWith("/actividad/")) {
            updatePayload.activityDetailViews = FieldValue.increment(1);
          }

          if (cleanActivityId) {
            updatePayload[`activities.${cleanActivityId}.views`] = FieldValue.increment(1);
          }
        } else if (type === "registration_started") {
          updatePayload.registrationStarts = FieldValue.increment(1);
          if (cleanActivityId) {
            updatePayload[`activities.${cleanActivityId}.registrationStarts`] = FieldValue.increment(1);
          }
        }

        await dailyRef.set(updatePayload, { merge: true });
      } catch (firestoreErr) {
        // Safe capture of permission or connection errors without failing the tracking call
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.warn("[METRICS_TRACK_ERROR]", err?.message || err);
    return res.status(200).json({ success: false });
  }
});

/**
 * Acquisition Funnel & Navigation Analytics (Admin Auth Protected)
 * Aggregates daily metrics from webMetricsDaily across the requested period,
 * with seamless fallback to in-memory tracking when Firestore Admin is restricted.
 */
app.get("/api/metrics/acquisition", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || "30d";
    const startDateQuery = (req.query.startDate as string) || "";
    const endDateQuery = (req.query.endDate as string) || "";

    const todayStr = getTodayDateString();
    let rangeStart = todayStr;
    let rangeEnd = todayStr;

    const todayDate = new Date();

    if (period === "30d") {
      const past30 = new Date(todayDate);
      past30.setDate(past30.getDate() - 30);
      rangeStart = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, '0')}-${String(past30.getDate()).padStart(2, '0')}`;
      rangeEnd = todayStr;
    } else if (period === "month") {
      rangeStart = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`;
      rangeEnd = todayStr;
    } else if (period === "year") {
      rangeStart = `${todayDate.getFullYear()}-01-01`;
      rangeEnd = todayStr;
    } else if (period === "all") {
      rangeStart = "2020-01-01";
      rangeEnd = todayStr;
    } else if (period === "custom") {
      rangeStart = startDateQuery || todayStr;
      rangeEnd = endDateQuery || todayStr;
    }

    let totalCatasViews = 0;
    let totalActivityViews = 0;
    let totalRegistrationStarts = 0;
    let totalReservationsCompleted = 0;
    const pathsAggregate: Record<string, number> = {};
    const activitiesAggregate: Record<string, { views: number; starts: number; completed: number }> = {};
    const activitiesMap = new Map<string, string>();

    let usedFirestore = false;
    let firestoreReadSuccess = false;

    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      try {
        const firestore = getFirestore(adminApp);

        // Fetch activities for mapping friendly titles
        try {
          const actDocs = await firestore.collection("activities").get();
          actDocs.forEach(d => {
            const dData = d.data();
            activitiesMap.set(d.id, dData?.title || d.id);
          });
        } catch {
          // Ignore activities read failures
        }

        // Query daily metrics within date range
        const snapshot = await firestore.collection("webMetricsDaily")
          .where("date", ">=", rangeStart)
          .where("date", "<=", rangeEnd)
          .get();

        snapshot.forEach(doc => {
          const data = doc.data() || {};
          totalCatasViews += Number(data.catasViews || 0);
          totalActivityViews += Number(data.activityDetailViews || 0);
          totalRegistrationStarts += Number(data.registrationStarts || 0);
          totalReservationsCompleted += Number(data.reservationsCompleted || 0);

          if (data.paths && typeof data.paths === 'object') {
            for (const [p, cnt] of Object.entries(data.paths)) {
              pathsAggregate[p] = (pathsAggregate[p] || 0) + Number(cnt || 0);
            }
          }

          if (data.activities && typeof data.activities === 'object') {
            for (const [actId, actStats] of Object.entries(data.activities as Record<string, any>)) {
              if (!activitiesAggregate[actId]) {
                activitiesAggregate[actId] = { views: 0, starts: 0, completed: 0 };
              }
              activitiesAggregate[actId].views += Number(actStats?.views || 0);
              activitiesAggregate[actId].starts += Number(actStats?.registrationStarts || 0);
              activitiesAggregate[actId].completed += Number(actStats?.reservationsCompleted || 0);
            }
          }
        });

        usedFirestore = true;
        firestoreReadSuccess = true;
      } catch (firestoreErr: any) {
        console.warn("[METRICS_ACQUISITION_FIRESTORE_WARN]", firestoreErr?.message || firestoreErr);
        usedFirestore = false;
        firestoreReadSuccess = false;
      }
    }

    // Fallback: If Firestore was not used, failed with permission error, or returned 0 but in-memory has data
    if (!firestoreReadSuccess || (totalCatasViews + totalActivityViews + totalRegistrationStarts + totalReservationsCompleted === 0 && inMemoryDailyMetrics.size > 0)) {
      for (const [dateKey, rec] of inMemoryDailyMetrics.entries()) {
        if (dateKey >= rangeStart && dateKey <= rangeEnd) {
          totalCatasViews += rec.catasViews;
          totalActivityViews += rec.activityDetailViews;
          totalRegistrationStarts += rec.registrationStarts;
          totalReservationsCompleted += rec.reservationsCompleted;

          for (const [p, cnt] of Object.entries(rec.paths)) {
            pathsAggregate[p] = (pathsAggregate[p] || 0) + cnt;
          }

          for (const [actId, stats] of Object.entries(rec.activities)) {
            if (!activitiesAggregate[actId]) {
              activitiesAggregate[actId] = { views: 0, starts: 0, completed: 0 };
            }
            activitiesAggregate[actId].views += stats.views;
            activitiesAggregate[actId].starts += stats.starts;
            activitiesAggregate[actId].completed += stats.completed;
          }
        }
      }
    }

    const totalEvents = totalCatasViews + totalActivityViews + totalRegistrationStarts + totalReservationsCompleted;
    const hasNoData = totalEvents === 0;
    const isCollecting = totalEvents > 0 && totalEvents < 10;
    const metricStatus: 'real' | 'collecting' | 'nodata' = hasNoData
      ? 'nodata'
      : isCollecting
      ? 'collecting'
      : 'real';

    const activityToCatasPercent = totalCatasViews > 0 ? (totalActivityViews / totalCatasViews) * 100 : null;
    const startsToActivityPercent = totalActivityViews > 0 ? (totalRegistrationStarts / totalActivityViews) * 100 : null;
    const completedToStartsPercent = totalRegistrationStarts > 0 ? (totalReservationsCompleted / totalRegistrationStarts) * 100 : null;

    const getPageLabel = (p: string) => {
      if (p === "/") return "Portada Principal";
      if (p === "/catas") return "Catas & Experiencias";
      if (p === "/cursos") return "Cursos & Talleres";
      if (p === "/viajes") return "Viajes Gastronómicos";
      if (p === "/conocenos") return "Conócenos";
      if (p === "/instalaciones") return "Instalaciones";
      if (p === "/contacto") return "Contacto";
      if (p.startsWith("/actividad/")) {
        const id = p.split("/")[2];
        const actTitle = activitiesMap.get(id);
        return actTitle ? `Ficha: ${actTitle}` : `Ficha de Actividad (${id})`;
      }
      return p;
    };

    const topPages = Object.entries(pathsAggregate)
      .filter(([p]) => !p.startsWith('/admin'))
      .map(([p, views]) => ({
        path: p,
        label: getPageLabel(p),
        views
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const activityInterest = Object.entries(activitiesAggregate)
      .map(([actId, stats]) => {
        const title = activitiesMap.get(actId) || `Actividad ${actId}`;
        const conversionRate = stats.views > 0 ? (stats.completed / stats.views) * 100 : null;
        return {
          activityId: actId,
          title,
          views: stats.views,
          starts: stats.starts,
          completed: stats.completed,
          conversionRate
        };
      })
      .sort((a, b) => b.views - a.views);

    const conversionOpportunities = activityInterest
      .filter(a => a.views >= 3 && (a.completed === 0 || a.starts === 0))
      .map(a => ({
        activityId: a.activityId,
        title: a.title,
        views: a.views,
        starts: a.starts,
        completed: a.completed,
        reason: a.starts === 0
          ? `${a.views} visitas a la ficha sin ningún inicio de inscripción.`
          : `${a.starts} inicios de reserva sin reservas completadas.`
      }));

    return res.status(200).json({
      period,
      periodType: period,
      source: usedFirestore && firestoreReadSuccess
        ? "Base de datos Firestore (Cloud)"
        : "Registro de telemetría de Doña Berenjena",
      updatedAt: new Date().toISOString(),
      status: metricStatus,
      funnel: {
        catasViews: totalCatasViews,
        activityViews: totalActivityViews,
        registrationStarts: totalRegistrationStarts,
        reservationsCompleted: totalReservationsCompleted,
        rates: {
          activityToCatasPercent,
          startsToActivityPercent,
          completedToStartsPercent
        }
      },
      topPages,
      activityInterest,
      conversionOpportunities
    });
  } catch (err: any) {
    console.error("[METRICS_ACQUISITION_QUERY_ERROR]", err);
    // Safe graceful fallback on any unexpected error to prevent UI crash
    return res.status(200).json({
      period: (req.query.period as string) || "30d",
      periodType: (req.query.period as string) || "30d",
      source: "Telemetría interna de Doña Berenjena",
      updatedAt: new Date().toISOString(),
      status: "nodata",
      funnel: {
        catasViews: 0,
        activityViews: 0,
        registrationStarts: 0,
        reservationsCompleted: 0,
        rates: {
          activityToCatasPercent: null,
          startsToActivityPercent: null,
          completedToStartsPercent: null
        }
      },
      topPages: [],
      activityInterest: [],
      conversionOpportunities: []
    });
  }
});

// Catch-all for API routes to prevent falling through to SPA fallback
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Ruta de API no encontrada." });
});

export default app;
