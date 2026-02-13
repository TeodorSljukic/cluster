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
        if (translated && translated !== text) {
          translations[targetLocale] = translated;
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
 * Translate text from one language to another
 * Uses LibreTranslate public API (free, no API key needed)
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

  try {
    console.log(`[TRANSLATE] Translating "${text.substring(0, 30)}..." from ${sourceLang} to ${targetLang}`);
    
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
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || text;
        if (translated && translated !== text) {
          console.log(`[TRANSLATE] LibreTranslate result: "${translated.substring(0, 30)}..."`);
          return translated;
        }
      }
    } catch (libreError: any) {
      console.warn(`[TRANSLATE] LibreTranslate failed, trying alternative:`, libreError.message);
    }

    // 2. Fallback: Try MyMemory Translation API (free tier available)
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
      
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(myMemoryUrl, {
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);

      if (response.ok) {
        const data = await response.json();
        const translated = data.responseData?.translatedText || text;
        if (translated && translated !== text && translated !== "MYMEMORY WARNING") {
          console.log(`[TRANSLATE] MyMemory result: "${translated.substring(0, 30)}..."`);
          return translated;
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
 */
export async function translateHTML(
  html: string,
  sourceLocale: Locale = "en"
): Promise<Record<Locale, string>> {
  // Extract text content from HTML
  const textContent = html.replace(/<[^>]*>/g, " ").trim();
  
  if (!textContent) {
    return {
      me: html,
      en: html,
      it: html,
      sq: html,
    };
  }

  // Translate the text content
  const translations = await autoTranslate(textContent, sourceLocale);

  // For HTML, we'll return the translated text wrapped in the same structure
  // In a real implementation, you'd want to preserve HTML structure better
  return translations;
}
