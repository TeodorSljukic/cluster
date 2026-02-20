import { type Locale } from "./i18n";

const TRANSLATION_DEBUG = process.env.TRANSLATION_DEBUG === "1";
const dbg = (...args: any[]) => {
  if (TRANSLATION_DEBUG) console.log(...args);
};

// Language codes mapping
const languageCodes: Record<Locale, string> = {
  me: "sr", // Montenegrin/Serbian
  en: "en",
  it: "it",
  sq: "sq", // Albanian
};

// LibreTranslate language codes (may differ from standard codes)
const libreTranslateCodes: Record<Locale, string> = {
  me: "sr", // Serbian
  en: "en",
  it: "it",
  sq: "sq", // Albanian
};

/**
 * Check if translated text contains an error message
 */
function containsErrorMessage(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const errorPatterns = [
    "QUERY LENGTH LIMIT",
    "MAX ALLOWED QUERY",
    "500 CHARS",
    "MYMEMORY WARNING",
    "Error:",
    "error:",
  ];
  return errorPatterns.some(pattern => text.includes(pattern));
}

/**
 * Automatically translate text to all supported languages
 * Uses a free translation API (LibreTranslate or similar)
 */
export async function autoTranslate(
  text: string,
  sourceLocale: Locale = "en"
): Promise<Record<Locale, string>> {
  dbg(`[AUTO TRANSLATE] Starting translation for text: "${text.substring(0, 50)}..." from locale: ${sourceLocale}`);
  
  const translations: Record<Locale, string> = {
    me: text,
    en: text,
    it: text,
    sq: text,
  };

  // If source is already in target language, keep original
  const sourceLang = languageCodes[sourceLocale];
  dbg(`[AUTO TRANSLATE] Source language code: ${sourceLang}`);

  try {
    // Try using LibreTranslate (free, self-hosted option)
    // Or use Google Translate API (requires API key)
    // For now, we'll use a simple approach with fetch to a translation service
    
    const targets: Locale[] = ["me", "en", "it", "sq"].filter(
      (loc) => loc !== sourceLocale
    ) as Locale[];
    
    dbg(`[AUTO TRANSLATE] Target locales to translate:`, targets);

    for (const targetLocale of targets) {
      try {
        dbg(`[AUTO TRANSLATE] Translating to ${targetLocale} (${languageCodes[targetLocale]})...`);
        const translated = await translateText(
          text,
          sourceLang,
          languageCodes[targetLocale]
        );
        dbg(`[AUTO TRANSLATE] Translation result for ${targetLocale}:`, {
          originalLength: text.length,
          translatedLength: translated?.length || 0,
          isSame: translated === text,
          preview: translated?.substring(0, 50),
        });
        
        // Check if translation contains error message
        if (translated && translated !== text && !containsErrorMessage(translated)) {
          translations[targetLocale] = translated;
          dbg(`[AUTO TRANSLATE] ✅ Successfully translated to ${targetLocale}: "${translated.substring(0, 50)}..."`);
        } else if (containsErrorMessage(translated)) {
          console.warn(`[AUTO TRANSLATE] ⚠️ Translation for ${targetLocale} contains error message, using original text`);
          translations[targetLocale] = text;
        } else {
          console.warn(`[AUTO TRANSLATE] ⚠️ Translation for ${targetLocale} returned same text or empty, keeping original`);
        }
      } catch (error: any) {
        console.error(`[AUTO TRANSLATE] ❌ Translation error for ${targetLocale}:`, error?.message || error);
        if (TRANSLATION_DEBUG) console.error(`[AUTO TRANSLATE] Error stack:`, error?.stack);
        // Keep original text if translation fails
        translations[targetLocale] = text;
      }
    }
    
    dbg(`[AUTO TRANSLATE] Final translations:`, {
      me: translations.me?.substring(0, 30),
      en: translations.en?.substring(0, 30),
      it: translations.it?.substring(0, 30),
      sq: translations.sq?.substring(0, 30),
    });
  } catch (error: any) {
    console.error("[AUTO TRANSLATE] ❌ Auto-translation error:", error?.message || error);
    if (TRANSLATION_DEBUG) console.error("[AUTO TRANSLATE] Error stack:", error?.stack);
  }

  return translations;
}

/**
 * Split text into chunks of max length, trying to split at sentence boundaries
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    // Try to find a good split point (sentence boundary)
    const chunk = remaining.substring(0, maxLength);
    const lastPeriod = chunk.lastIndexOf(".");
    const lastExclamation = chunk.lastIndexOf("!");
    const lastQuestion = chunk.lastIndexOf("?");
    const lastNewline = chunk.lastIndexOf("\n");
    
    // Find the best split point
    const splitPoints = [lastPeriod, lastExclamation, lastQuestion, lastNewline].filter(p => p > maxLength * 0.5);
    const splitPoint = splitPoints.length > 0 ? Math.max(...splitPoints) + 1 : maxLength;

    chunks.push(remaining.substring(0, splitPoint).trim());
    remaining = remaining.substring(splitPoint).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Translate text from one language to another
 * Uses LibreTranslate public API (free, no API key needed)
 * Handles 500 character limit by splitting text into chunks and translating each chunk
 */
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // Skip if text is empty
  if (!text || text.trim() === "") {
    return text;
  }

  // Check length limit (500 chars for LibreTranslate)
  const MAX_LENGTH = 500;
  
  // If text is longer than limit, split into chunks
  if (text.length > MAX_LENGTH) {
    const chunks = splitIntoChunks(text, MAX_LENGTH);
    console.log(`[TRANSLATE] Text is ${text.length} chars, splitting into ${chunks.length} chunks`);
    
    // Translate each chunk separately
    const translatedChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[TRANSLATE] Translating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      const translatedChunk = await translateTextChunk(chunks[i], sourceLang, targetLang);
      translatedChunks.push(translatedChunk);
      
      // Add small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Join all translated chunks
    return translatedChunks.join(" ");
  }
  
  // If text is short enough, translate directly
  return translateTextChunk(text, sourceLang, targetLang);
}

/**
 * Translate a single chunk of text (max 500 chars)
 */
async function translateTextChunk(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const MAX_LENGTH = 500;
  const textToTranslate = text.length > MAX_LENGTH ? text.substring(0, MAX_LENGTH) : text;
  const isTruncated = text.length > MAX_LENGTH;

  const translateWithGoogleGtx = async (
    q: string,
    sl: string,
    tl: string
  ): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const url =
        "https://translate.googleapis.com/translate_a/single" +
        `?client=gtx&sl=${encodeURIComponent(sl)}` +
        `&tl=${encodeURIComponent(tl)}` +
        `&dt=t&q=${encodeURIComponent(q)}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const t = await res.text();
        console.warn(`[TRANSLATE] Google GTX API error (${res.status}):`, t.substring(0, 200));
        return null;
      }

      const data: any = await res.json();
      // Expected shape: [[["Ciao mondo","Hello world",...], ...], ...]
      const parts: any[] | undefined = Array.isArray(data) ? data[0] : undefined;
      if (!Array.isArray(parts)) return null;

      const translated = parts
        .map((p) => (Array.isArray(p) ? p[0] : ""))
        .filter((s) => typeof s === "string" && s.length > 0)
        .join("");

      if (!translated || typeof translated !== "string") return null;
      return translated;
    } catch (err: any) {
      console.warn(`[TRANSLATE] Google GTX failed:`, err?.message || err);
      return null;
    }
  };

  try {
    console.log(`[TRANSLATE] Translating "${textToTranslate.substring(0, 30)}..." from ${sourceLang} to ${targetLang}${isTruncated ? ` (truncated from ${text.length} chars)` : ""}`);
    
    const provider = (process.env.TRANSLATE_PROVIDER || "").toLowerCase();

    // Try multiple translation services for better reliability.
    // Default behavior: prefer Google GTX (more reliable than public LibreTranslate/MyMemory which rate-limit hard).
    const preferLibre = provider === "libretranslate";

    // 1) Preferred provider
    if (!preferLibre) {
      // Google GTX
      const gtx = await translateWithGoogleGtx(textToTranslate, sourceLang, targetLang);
      if (gtx && gtx !== textToTranslate && gtx !== text) {
        console.log(`[TRANSLATE] Google GTX result: "${gtx.substring(0, 30)}..."`);
        return isTruncated ? gtx + text.substring(MAX_LENGTH) : gtx;
      }
    }

    // 2) LibreTranslate (public endpoint may rate-limit; keep as fallback unless explicitly preferred)
    try {
      const libreUrl = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com/translate";
      const libreApiKey = process.env.LIBRETRANSLATE_API_KEY;
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(libreUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: textToTranslate,
          source: sourceLang,
          target: targetLang,
          format: "text",
          ...(libreApiKey ? { api_key: libreApiKey } : {}),
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || textToTranslate;
        console.log(`[TRANSLATE] LibreTranslate response for ${sourceLang}->${targetLang}:`, {
          status: response.status,
          hasTranslatedText: !!data.translatedText,
          translatedLength: translated?.length || 0,
          originalLength: textToTranslate.length,
        });
        // Check if response contains error message
        if (translated && typeof translated === "string" && 
            (translated.includes("QUERY LENGTH LIMIT") || 
             translated.includes("MAX ALLOWED QUERY") ||
             translated.includes("500 CHARS"))) {
          console.warn(`[TRANSLATE] Response contains error message, using original text`);
          return text; // Return original if error in response
        }
        if (translated && translated !== textToTranslate && translated !== text && translated.trim() !== "") {
          console.log(`[TRANSLATE] LibreTranslate success: "${translated.substring(0, 50)}..."`);
          // If text was truncated, append original remaining text
          return isTruncated ? translated + text.substring(MAX_LENGTH) : translated;
        } else {
          console.warn(`[TRANSLATE] LibreTranslate returned same text or empty, translated="${translated?.substring(0, 30)}", original="${textToTranslate.substring(0, 30)}"`);
        }
      } else {
        const errorText = await response.text();
        console.error(`[TRANSLATE] LibreTranslate API error (${response.status}):`, errorText.substring(0, 200));
        if (errorText.includes("QUERY LENGTH LIMIT") || 
            errorText.includes("500") ||
            errorText.includes("MAX ALLOWED QUERY")) {
          console.warn(`[TRANSLATE] Query length limit exceeded, skipping translation`);
          return text; // Return original if limit exceeded
        }
      }
    } catch (libreError: any) {
      if (libreError.message?.includes("QUERY LENGTH LIMIT") || libreError.message?.includes("500")) {
        console.warn(`[TRANSLATE] Query length limit exceeded, skipping translation`);
        return text; // Return original if limit exceeded
      }
      console.warn(`[TRANSLATE] LibreTranslate failed, trying alternative:`, libreError.message);
    }

    // 3) Google GTX fallback if LibreTranslate failed or returned same text
    const gtx2 = await translateWithGoogleGtx(textToTranslate, sourceLang, targetLang);
    if (gtx2 && gtx2 !== textToTranslate && gtx2 !== text) {
      console.log(`[TRANSLATE] Google GTX result: "${gtx2.substring(0, 30)}..."`);
      return isTruncated ? gtx2 + text.substring(MAX_LENGTH) : gtx2;
    }

    // 4) Last fallback: MyMemory Translation API (very limited free tier)
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
      
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(myMemoryUrl, {
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);

      if (response.ok) {
        const data = await response.json();
        const translated = data.responseData?.translatedText || textToTranslate;
        // Check if response contains error message
        if (translated && typeof translated === "string" && 
            (translated.includes("QUERY LENGTH LIMIT") || 
             translated.includes("MAX ALLOWED QUERY") ||
             translated.includes("500 CHARS") ||
             translated === "MYMEMORY WARNING")) {
          console.warn(`[TRANSLATE] Response contains error message, using original text`);
          return text; // Return original if error in response
        }
        if (translated && translated !== textToTranslate && translated !== text) {
          console.log(`[TRANSLATE] MyMemory result: "${translated.substring(0, 30)}..."`);
          // If text was truncated, append original remaining text
          return isTruncated ? translated + text.substring(MAX_LENGTH) : translated;
        }
      }
    } catch (myMemoryError: any) {
      console.warn(`[TRANSLATE] MyMemory failed:`, myMemoryError.message);
    }

    // If all services fail, return original text
    console.warn(`[TRANSLATE] All translation services failed, returning original text`);
    return text;
  } catch (error) {
    console.error(`[TRANSLATE] Error translating from ${sourceLang} to ${targetLang}:`, error);
    // Fallback: return original text
    return text;
  }
}

/**
 * Translate HTML content (preserves HTML tags)
 * Only translates text content, preserving HTML structure
 */
export async function translateHTML(
  html: string,
  sourceLocale: Locale = "en"
): Promise<Record<Locale, string>> {
  // If HTML is empty or just whitespace, return as-is for all locales
  if (!html || html.trim() === "") {
    return {
      me: html,
      en: html,
      it: html,
      sq: html,
    };
  }

  // Extract text content from HTML (remove tags but preserve structure)
  const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  
  if (!textContent) {
    return {
      me: html,
      en: html,
      it: html,
      sq: html,
    };
  }

  // Translate the full text content (will be automatically chunked if needed)
  console.log(`[TRANSLATE HTML] Extracted text content length: ${textContent.length}`);
  console.log(`[TRANSLATE HTML] Text preview: "${textContent.substring(0, 100)}..."`);
  const translations = await autoTranslate(textContent, sourceLocale);
  console.log(`[TRANSLATE HTML] Got translations for locales:`, Object.keys(translations));

  // Replace text content in HTML with translated versions
  // Better approach: replace text nodes while preserving HTML structure
  const result: Record<Locale, string> = {
    me: html,
    en: html,
    it: html,
    sq: html,
  };

  for (const locale of ["me", "en", "it", "sq"] as Locale[]) {
    let translatedText = translations[locale];
    console.log(`[TRANSLATE HTML] Processing locale ${locale}, translated text length: ${translatedText?.length || 0}`);
    
    // Check if translation contains error message
    if (containsErrorMessage(translatedText)) {
      console.warn(`[TRANSLATE] HTML translation for ${locale} contains error message, using original HTML`);
      translatedText = textContent; // Use original text if error found
    }
    
    // Simple approach: replace text nodes while preserving HTML tags
    // Split HTML into parts (tags and text)
    const parts = html.split(/(<[^>]*>)/);
    let translatedHTML = '';
    let textIndex = 0;
    
    // Count total words in original text
    const originalWords = textContent.trim().split(/\s+/);
    const translatedWords = translatedText.trim().split(/\s+/);
    
    // Process each part
    for (const part of parts) {
      if (part.startsWith('<') && part.endsWith('>')) {
        // HTML tag - keep as is
        translatedHTML += part;
      } else {
        // Text content
        const trimmedPart = part.trim();
        if (trimmedPart) {
          // Count words in this text part
          const wordsInPart = trimmedPart.split(/\s+/).length;
          
          // Get corresponding translated words
          if (textIndex + wordsInPart <= translatedWords.length) {
            const translatedPart = translatedWords.slice(textIndex, textIndex + wordsInPart).join(' ');
            textIndex += wordsInPart;
            
            // Preserve whitespace from original
            const leadingSpace = part.match(/^\s*/)?.[0] || '';
            const trailingSpace = part.match(/\s*$/)?.[0] || '';
            translatedHTML += leadingSpace + translatedPart + trailingSpace;
          } else {
            // Not enough words - use remaining translated words or keep original
            const remainingWords = translatedWords.slice(textIndex);
            if (remainingWords.length > 0) {
              translatedHTML += part.replace(trimmedPart, remainingWords.join(' '));
              textIndex = translatedWords.length;
            } else {
              translatedHTML += part;
            }
          }
        } else {
          // Just whitespace - keep as is
          translatedHTML += part;
        }
      }
    }
    
    // Fallback: if replacement didn't work well, try simple string replacement
    if (!translatedHTML || translatedHTML === html) {
      console.warn(`[TRANSLATE HTML] Word-by-word replacement failed for ${locale}, trying simple replacement`);
      const normalizedHTML = html.replace(/\s+/g, ' ');
      const normalizedTextContent = textContent.replace(/\s+/g, ' ').trim();
      const normalizedTranslatedText = translatedText.replace(/\s+/g, ' ').trim();
      
      if (normalizedHTML.includes(normalizedTextContent)) {
        translatedHTML = normalizedHTML.replace(normalizedTextContent, normalizedTranslatedText);
        console.log(`[TRANSLATE HTML] Simple replacement succeeded for ${locale}`);
      } else {
        // Last resort: return original HTML (translation failed)
        console.error(`[TRANSLATE HTML] All replacement methods failed for ${locale}`);
        console.error(`[TRANSLATE HTML] HTML length: ${html.length}, textContent length: ${textContent.length}, translatedText length: ${translatedText.length}`);
        translatedHTML = html;
      }
    }
    
    console.log(`[TRANSLATE HTML] Final HTML for ${locale} length: ${translatedHTML.length}`);
    result[locale] = translatedHTML;
  }

  return result;
}
