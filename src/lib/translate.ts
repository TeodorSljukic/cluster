import { type Locale } from "./i18n";

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
  const translations: Record<Locale, string> = {
    me: text,
    en: text,
    it: text,
    sq: text,
  };

  // If source is already in target language, keep original
  const sourceLang = languageCodes[sourceLocale];

  try {
    // Try using LibreTranslate (free, self-hosted option)
    // Or use Google Translate API (requires API key)
    // For now, we'll use a simple approach with fetch to a translation service
    
    const targets: Locale[] = ["me", "en", "it", "sq"].filter(
      (loc) => loc !== sourceLocale
    ) as Locale[];

    for (const targetLocale of targets) {
      try {
        const translated = await translateText(
          text,
          sourceLang,
          languageCodes[targetLocale]
        );
        // Check if translation contains error message
        if (translated && translated !== text && !containsErrorMessage(translated)) {
          translations[targetLocale] = translated;
        } else if (containsErrorMessage(translated)) {
          console.warn(`[TRANSLATE] Translation for ${targetLocale} contains error message, using original text`);
          translations[targetLocale] = text;
        }
      } catch (error) {
        console.error(`Translation error for ${targetLocale}:`, error);
        // Keep original text if translation fails
        translations[targetLocale] = text;
      }
    }
  } catch (error) {
    console.error("Auto-translation error:", error);
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

  try {
    console.log(`[TRANSLATE] Translating "${textToTranslate.substring(0, 30)}..." from ${sourceLang} to ${targetLang}${isTruncated ? ` (truncated from ${text.length} chars)` : ""}`);
    
    // Try multiple translation services for better reliability
    // 1. Try LibreTranslate first (free, no API key)
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: textToTranslate,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || textToTranslate;
        // Check if response contains error message
        if (translated && typeof translated === "string" && 
            (translated.includes("QUERY LENGTH LIMIT") || 
             translated.includes("MAX ALLOWED QUERY") ||
             translated.includes("500 CHARS"))) {
          console.warn(`[TRANSLATE] Response contains error message, using original text`);
          return text; // Return original if error in response
        }
        if (translated && translated !== textToTranslate && translated !== text) {
          console.log(`[TRANSLATE] LibreTranslate result: "${translated.substring(0, 30)}..."`);
          // If text was truncated, append original remaining text
          return isTruncated ? translated + text.substring(MAX_LENGTH) : translated;
        }
      } else {
        const errorText = await response.text();
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

    // 2. Fallback: Try MyMemory Translation API (free tier available)
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
  const translations = await autoTranslate(textContent, sourceLocale);

  // Replace text content in HTML with translated versions
  // This is a simplified approach - in production you'd want better HTML parsing
  const result: Record<Locale, string> = {
    me: html,
    en: html,
    it: html,
    sq: html,
  };

  for (const locale of ["me", "en", "it", "sq"] as Locale[]) {
    let translatedText = translations[locale];
    // Check if translation contains error message
    if (containsErrorMessage(translatedText)) {
      console.warn(`[TRANSLATE] HTML translation for ${locale} contains error message, using original HTML`);
      translatedText = textContent; // Use original text if error found
    }
    // Simple replacement: replace the extracted text with translated text
    // This works if the HTML structure is simple
    result[locale] = html.replace(textContent, translatedText);
  }

  return result;
}
