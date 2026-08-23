import { WineDetail } from '../types';

export interface ParsedCataInfo {
  title: string;
  subtitle?: string;
  bodegaName: string;
  bodegaRegion?: string;
  dates: string[]; // Two dates if detected: [date1, date2]
  date: string; // First date
  date2?: string; // Second date
  time: string; // e.g. "21:00" or "13:00"
  time2?: string; // e.g. "13:00"
  price: number; // Default 25.00
  totalSpots: number; // Default 14
  location: string; // Complete official location
  sumiller?: string; // e.g. "Ana García"
  aove?: string;
  colaboradores?: string;
  wines: WineDetail[];
  description: string; // Empty by default
  rawText?: string;
}

const MONTHS_MAP: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12'
};

export const DEFAULT_OFFICIAL_LOCATION = 'Polígono Industrial “El Salobral “- Centro de Formación – Bolaños de Calatrava';

/**
 * Returns default start time based on day of week:
 * - Friday (Viernes, 5) -> "21:00"
 * - Sunday (Domingo, 0) -> "13:00"
 * - Other -> "20:30"
 */
export function getDefaultStartTime(isoDateStr: string): string {
  if (!isoDateStr) return '21:00';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 5 is Friday
      if (dayOfWeek === 5) return '21:00';
      if (dayOfWeek === 0) return '13:00';
    }
  } catch (e) {
    // fallback
  }
  return '21:00';
}

/**
 * Dynamically loads and configures PDF.js
 */
async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib;
    try {
      if (lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    } catch (e) {
      // ignore
    }
    return lib;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      try {
        if (lib && lib.GlobalWorkerOptions) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      } catch (e) {
        // ignore
      }
      resolve(lib || null);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/**
 * Fallback binary stream text extractor for PDF byte buffers
 */
function extractRawTextFromPdfBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 16384;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  const lines: string[] = [];

  // Extract parentheses-enclosed strings e.g. (Texto) Tj or TJ
  const textMatches = binary.match(/\((?:[^()\\]|\\.)*\)\s*(?:Tj|TJ|'|")/g);
  if (textMatches && textMatches.length > 0) {
    for (const m of textMatches) {
      const inner = m.replace(/\)\s*(?:Tj|TJ|'|")$/, '').replace(/^\(/, '');
      const decoded = inner
        .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\([\\()])/g, '$1')
        .trim();
      if (decoded.length > 0) {
        lines.push(decoded);
      }
    }
  }

  // Also extract text inside BT...ET blocks
  const btBlocks = binary.match(/BT[\s\S]*?ET/g);
  if (btBlocks) {
    for (const block of btBlocks) {
      const parts = block.match(/\(([^)]+)\)/g);
      if (parts) {
        for (const p of parts) {
          const t = p.slice(1, -1).trim();
          if (t.length > 0) lines.push(t);
        }
      }
    }
  }

  if (lines.length > 0) {
    return lines.join('\n');
  }

  const asciiMatches = binary.match(/[A-Za-z0-9ÁÉÍÓÚáéíóúÑñüÜ\s\.,–\-:;/"'()]{4,}/g);
  return (asciiMatches || []).join('\n');
}

/**
 * Extract plain text preserving layout lines by grouping items by vertical Y coordinates
 */
export async function extractTextFromPdf(pdfData: ArrayBuffer | Uint8Array | File): Promise<string> {
  let dataBuffer: Uint8Array;
  if (pdfData instanceof File) {
    const buf = await pdfData.arrayBuffer();
    dataBuffer = new Uint8Array(buf);
  } else if (pdfData instanceof Uint8Array) {
    dataBuffer = pdfData;
  } else {
    dataBuffer = new Uint8Array(pdfData);
  }

  try {
    const lib = await loadPdfJs();
    if (lib && lib.getDocument) {
      const loadingTask = lib.getDocument({
        data: dataBuffer,
        useSystemFonts: true,
        isEvalSupported: false,
        disableFontFace: true,
        stopAtErrors: false
      });

      const pdf = await loadingTask.promise;
      const pageLines: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<any>;

        if (!items || items.length === 0) continue;

        // Sort items: Y descending (top to bottom), X ascending (left to right)
        const sortedItems = [...items].filter(it => it && typeof it.str === 'string').sort((a, b) => {
          const yA = a.transform ? a.transform[5] : 0;
          const yB = b.transform ? b.transform[5] : 0;
          const xA = a.transform ? a.transform[4] : 0;
          const xB = b.transform ? b.transform[4] : 0;

          if (Math.abs(yB - yA) > 4) {
            return yB - yA; // top to bottom
          }
          return xA - xB; // left to right
        });

        // Group into lines by Y coordinate
        let currentLineY: number | null = null;
        let currentLineText: string[] = [];

        for (const item of sortedItems) {
          const str = item.str.trim();
          if (!str) continue;

          const itemY = item.transform ? item.transform[5] : 0;

          if (currentLineY === null) {
            currentLineY = itemY;
            currentLineText.push(str);
          } else if (Math.abs(currentLineY - itemY) <= 5) {
            // Same visual line
            currentLineText.push(str);
          } else {
            // New line
            if (currentLineText.length > 0) {
              pageLines.push(currentLineText.join(' '));
            }
            currentLineY = itemY;
            currentLineText = [str];
          }
        }

        if (currentLineText.length > 0) {
          pageLines.push(currentLineText.join(' '));
        }
      }

      if (pageLines.length > 0) {
        return pageLines.join('\n');
      }
    }
  } catch (pdfErr) {
    console.warn('PDF.js layout extraction notice, attempting binary stream extraction:', pdfErr);
  }

  // Fallback: binary stream extraction
  try {
    const rawExtracted = extractRawTextFromPdfBuffer(dataBuffer);
    if (rawExtracted && rawExtracted.trim().length > 0) {
      return rawExtracted;
    }
  } catch (streamErr) {
    console.error('Binary stream decoder error:', streamErr);
  }

  throw new Error('No se pudo leer el archivo PDF seleccionado. Por favor, introduce los datos en el formulario.');
}

/**
 * Intelligent parser specifically tuned for Doña Berenjena tasting sheets
 */
export function parseCataText(rawText: string): ParsedCataInfo {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let title = '';
  let subtitle = '';
  const dates: string[] = [];
  let date1 = new Date().toISOString().split('T')[0];
  let date2 = '';
  let location = DEFAULT_OFFICIAL_LOCATION;
  let bodegaName = '';
  let bodegaRegion = '';
  let colaboradores = '';
  let sumiller = 'Ana García';
  let aove = '';
  let detectedPrice: number | undefined = undefined;
  const wines: WineDetail[] = [];

  // Clean whole text for regex matching if needed
  const fullText = lines.join('\n');

  // 1. DATE EXTRACTION: Handles "5 y 19 de JUNIO de 2026", "10 y 17 de ABRIL de 2026", etc.
  for (const line of lines) {
    const twoDatesMatch = line.match(/(\d{1,2})\s*(?:y|&|\/|-)\s*(\d{1,2})\s*de\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)\s*(?:de)?\s*(\d{4})/i);
    if (twoDatesMatch) {
      const day1 = twoDatesMatch[1].padStart(2, '0');
      const day2 = twoDatesMatch[2].padStart(2, '0');
      const monthStr = twoDatesMatch[3].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const year = twoDatesMatch[4];
      const monthNum = MONTHS_MAP[monthStr] || '06';

      date1 = `${year}-${monthNum}-${day1}`;
      date2 = `${year}-${monthNum}-${day2}`;
      dates.push(date1, date2);
      break;
    }

    const singleDateMatch = line.match(/(\d{1,2})\s*de\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)\s*(?:de)?\s*(\d{4})/i);
    if (singleDateMatch) {
      const day = singleDateMatch[1].padStart(2, '0');
      const monthStr = singleDateMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const year = singleDateMatch[3];
      const monthNum = MONTHS_MAP[monthStr] || '06';
      date1 = `${year}-${monthNum}-${day}`;
      dates.push(date1);
      break;
    }
  }

  if (dates.length === 0) {
    dates.push(date1);
  }

  // 2. LOCATION EXTRACTION
  let locationLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('poligono') || line.toLowerCase().includes('polígono') || line.toLowerCase().includes('salobral') || line.toLowerCase().includes('bolaños')) {
      location = line.replace(/^[–\-—\s]+|[–\-—\s]+$/g, '');
      locationLineIndex = i;
      break;
    }
  }
  if (!location) {
    location = DEFAULT_OFFICIAL_LOCATION;
  }

  // 3. TITLE & BODEGA EXTRACTION
  // The title is strictly what appears right after the address header ("Polígono Industrial El Salobral...")
  if (locationLineIndex !== -1 && lines[locationLineIndex + 1]) {
    title = lines[locationLineIndex + 1].replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
  }

  // If title was "Experiencia S.A.T. COLOMAN", extract bodega name as "S.A.T. COLOMAN"
  if (title.toLowerCase().startsWith('experiencia')) {
    const match = title.match(/^experiencia\s+(.+)$/i);
    if (match) {
      bodegaName = match[1].trim();
    }
  }

  // Subtitle remains empty as requested
  subtitle = '';

  // Extract Bodega name and region from document
  for (const line of lines) {
    if (line.toLowerCase().includes('bodega')) {
      const match = line.match(/(?:bodegas?\s+)?([^(]+)(?:\(([^)]+)\))?/i);
      if (match) {
        let name = match[1].trim();
        if (!name.toLowerCase().startsWith('bodega')) {
          name = `Bodega ${name}`;
        }
        bodegaName = name;
        if (match[2]) {
          bodegaRegion = match[2].trim();
        }
      } else {
        bodegaName = line;
      }
      break;
    } else if (line.toLowerCase().includes('uveja negra') && !bodegaName) {
      bodegaName = 'Bodega La Uveja Negra';
      bodegaRegion = 'Carrión de Calatrava - Ciudad Real';
      break;
    }
  }

  if (!title) {
    title = bodegaName ? `Experiencia ${bodegaName}` : 'Cata de Bodega';
  }

  // 4. COLABORADORES BODEGUEROS
  for (const line of lines) {
    if (line.toLowerCase().includes('colaboracion') || line.toLowerCase().includes('colaboración') || line.toLowerCase().includes('bodegueros')) {
      colaboradores = line.replace(/^(?:especial\s+)?colaboraci[oó]n\s*(?:bodegueros)?[:\s-]*/i, '').trim();
      break;
    }
  }

  // 5. SUMILLER
  for (const line of lines) {
    if (line.toLowerCase().includes('sumiller:')) {
      sumiller = line.replace(/^sumiller:\s*/i, '').trim();
      break;
    } else if (line.toLowerCase().startsWith('sumiller')) {
      sumiller = line.replace(/^sumiller\s*[:\s-]*/i, '').trim();
      break;
    } else if (line.toLowerCase().includes('ana garc')) {
      sumiller = 'Ana García';
      break;
    }
  }

  // 6. AOVE EXTRACTION (e.g. "Dehesa de Almodovar", "Quinto Don Otilio", "World Cup", "Cornicabra", "Picual")
  let aoveProducer = '';
  let aoveVariety = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('aove') || lower.includes('aceite') || lower.includes('quinto don otilio') || lower.includes('dehesa de almodovar') || lower.includes('dehesa de almodóvar')) {
      if (lower.includes('quinto don otilio') || lower.includes('dehesa de almodovar') || lower.includes('dehesa de almodóvar')) {
        aoveProducer = line.replace(/["“”]/g, '').trim();
      }
      if (lower.includes('aove') || lower.includes('variedad') || lower.includes('picual') || lower.includes('cornicabra') || lower.includes('arbequina') || lower.includes('world cup')) {
        aoveVariety = line.replace(/^[–\-—\s"]+|[–\-—\s"]+$/g, '').trim();
      }
    }
  }
  if (aoveProducer && aoveVariety && !aoveProducer.includes(aoveVariety)) {
    aove = `${aoveProducer} - ${aoveVariety}`;
  } else if (aoveProducer) {
    aove = aoveProducer;
  } else if (aoveVariety) {
    aove = aoveVariety;
  }

  // 7. PRECIO (e.g. "25 € NO Socios" / "20 € Socios")
  for (const line of lines) {
    const priceMatch = line.match(/(?:25|30|35|20)\s*€/i);
    if (priceMatch && line.toLowerCase().includes('no socios')) {
      detectedPrice = 25.0;
      break;
    }
  }

  // 8. WINES & PAIRINGS (Vinos y Maridajes)
  // Supports: Blanco, El Blanco, Tinto, El Tinto, Rosado, El Rosado, Espumoso, El Espumoso, El Vino de Licor, Vino de Licor, Dulce, Generoso, Vermut, etc.
  const WINE_START_REGEX = /^(?:El\s+)?(Blanco|Tinto|Espumoso|Rosado|Vino\s+de\s+Licor|Licor|Generoso|Vermut|Dulce|Cava|Champagne|Oloroso|Amontillado|Fino|Manzanilla)\b\s*[–\-—:]*\s*(.*?)\s*[–\-—:]*$/i;
  const WINE_STOP_REGEX = /^(?:El\s+)?(Blanco|Tinto|Espumoso|Rosado|Vino\s+de\s+Licor|Licor|Generoso|Vermut|Dulce|Cava|Champagne|Oloroso|Amontillado|Fino|Manzanilla|SUMILLER|AOVE|“?Quinto|“?Dehesa|Aforo|Precio|Horario)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Explicitly skip subtitle/header lines that contain general phrases
    if (
      /vino\s+artesano/i.test(line) ||
      /vinos?\s+de\s+agricultor/i.test(line) ||
      /expresi[oó]n\s+del\s+terruño/i.test(line) ||
      /experiencia\s+/i.test(line) ||
      /especial\s+colaboraci[oó]n/i.test(line)
    ) {
      continue;
    }

    const wineMatch = line.match(WINE_START_REGEX);

    if (wineMatch) {
      const rawType = wineMatch[1].trim();
      // Normalize type
      let type: string = 'Vino';
      if (/blanco/i.test(rawType)) type = 'Blanco';
      else if (/tinto/i.test(rawType)) type = 'Tinto';
      else if (/rosado/i.test(rawType)) type = 'Rosado';
      else if (/espumoso|cava|champagne/i.test(rawType)) type = 'Espumoso';
      else if (/vino\s+de\s+licor|licor|dulce/i.test(rawType)) type = 'Dulce';
      else if (/generoso|oloroso|amontillado|fino|manzanilla/i.test(rawType)) type = 'Generoso';
      else if (/vermut/i.test(rawType)) type = 'Vermut';
      else type = rawType;

      let name = wineMatch[2] ? wineMatch[2].replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim() : '';
      let grape = '';
      let pairing = '';

      // Lookahead in following lines for grape variety and pairing dish
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nextLine = lines[j];

        // Stop if next line is another wine type or sumiller or AOVE producer or footer
        if (WINE_STOP_REGEX.test(nextLine)) {
          break;
        }

        const lowerNext = nextLine.toLowerCase();

        if (lowerNext.includes('varietal') || lowerNext.includes('uva:') || lowerNext.includes('100%') || lowerNext.includes('100 %')) {
          grape = nextLine.replace(/varietal\s*(?:uva)?[:\s-]*/i, '').replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
        } else if (
          lowerNext.includes('acompañado') ||
          lowerNext.includes('emparejado') ||
          lowerNext.includes('armonía') ||
          lowerNext.includes('armonia') ||
          lowerNext.includes('maridaje') ||
          lowerNext.includes('maridado') ||
          lowerNext.startsWith('con ')
        ) {
          pairing = nextLine.replace(/^(?:acompañado\s+de|emparejado\s+con|en\s+armon[ií]a\s+con|en\s+armonia\s+con|maridado\s+con|maridaje[:\s-]*|con\s+)[:\s-]*/i, '').replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
        } else if (!name && !lowerNext.includes('sumiller') && !lowerNext.includes('aove') && !lowerNext.includes('aforo') && nextLine.length > 2) {
          name = nextLine.replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
        } else if (!pairing && grape && nextLine.length > 3) {
          pairing = nextLine.replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
        } else if (!pairing && !grape && nextLine.length > 3) {
          // If dish line came without prefix e.g. "Tartar de Langostinos...", "Crujiente de Alga...", "Higos Secos..."
          pairing = nextLine.replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
        }
      }

      wines.push({
        type,
        name: name || `${type} de la Bodega`,
        grape: grape || undefined,
        pairing: pairing || undefined
      });
    }
  }

  // Fallback for wines ONLY if no wine passes were detected
  if (wines.length === 0) {
    const globalWineRegex = /(Blanco|Tinto|Espumoso|Rosado)\s*[–\-—:]+\s*([^\n\r]+?)(?:\n|Varietal|Acompañado|Emparejado|En Armonía|$)/gi;
    let match;
    while ((match = globalWineRegex.exec(fullText)) !== null) {
      const type = match[1];
      const name = match[2].replace(/^[–\-—:\s]+|[–\-—:\s]+$/g, '').trim();
      if (name && !/artesano|agricultor|expresi/i.test(name)) {
        wines.push({
          type,
          name: name || type
        });
      }
    }
  }

  const time1 = getDefaultStartTime(date1);
  const time2 = date2 ? getDefaultStartTime(date2) : undefined;

  return {
    title: title || 'Cata de Bodega',
    subtitle: subtitle || (bodegaName ? `Con ${bodegaName}` : 'Vino Artesano y Ecologico'),
    dates,
    date: date1,
    date2: date2 || undefined,
    time: time1,
    time2: time2,
    price: detectedPrice || 25.0, // Default 25.00€
    totalSpots: 14, // Default 14
    location,
    bodegaName: bodegaName || 'Bodega La Uveja Negra',
    bodegaRegion: bodegaRegion || 'Carrión de Calatrava - Ciudad Real',
    colaboradores: colaboradores || '',
    sumiller: sumiller || 'Ana García',
    aove: aove || 'Quinto Don Otilio (Bolaños de Calatrava – Ciudad Real) - AOVE Picual',
    wines: wines.length > 0 ? wines : [
      { type: 'Blanco', name: 'El Jalbegandero', grape: '100 % Airen', pairing: 'Arroz Meloso con Veduritas y Atun en Escabeche' },
      { type: 'Tinto', name: 'La Uveja Negra', grape: '100 % Cencibel', pairing: 'Pan Bao de Pollo Especiado y Cebolla Morada' },
      { type: 'Espumoso', name: 'Pomposo', grape: '100 % Airen', pairing: 'Nachos con Guacamoles y Palomitas Dulces' }
    ],
    description: '', // Left empty as requested
    rawText
  };
}
