import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { autoTranslate, translateHTML } from "@/lib/translate";
import { type Locale } from "@/lib/i18n";

/**
 * Endpoint to automatically translate all posts that don't have translations
 * or have incomplete/error translations
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1" || searchParams.get("force") === "true";

    const collection = await getCollection("posts");
    const allPosts = await collection.find({}).toArray();

    let translated = 0;
    let skipped = 0;
    let errors = 0;
    const allLocales: Locale[] = ["me", "en", "it", "sq"];

    // Helper function to check if translations are missing, invalid, or are just copies of the source text
    const needsTranslation = (post: any): boolean => {
      if (force) return true;
      // Check if post has metadata with translations
      if (!post.metadata || !post.metadata.titleTranslations) {
        return true; // No translations at all
      }

      // Check if all required translations exist
      const titleTranslations = post.metadata.titleTranslations || {};
      const contentTranslations = post.metadata.contentTranslations || {};
      const excerptTranslations = post.metadata.excerptTranslations || {};

      const sourceLocale = ((post.locale || "me") as Locale);
      const sourceTitle = (post.title || "") as string;
      const sourceContent = (post.content || "") as string;
      const sourceExcerpt = (post.excerpt || "") as string;

      // If translations are identical to the source text for any *other* locale, we should re-translate.
      const hasCopiedTitle = allLocales.some((loc) =>
        loc !== sourceLocale &&
        typeof titleTranslations[loc] === "string" &&
        titleTranslations[loc].trim() !== "" &&
        titleTranslations[loc].trim() === sourceTitle.trim()
      );
      const hasCopiedContent = allLocales.some((loc) =>
        loc !== sourceLocale &&
        typeof contentTranslations[loc] === "string" &&
        contentTranslations[loc].trim() !== "" &&
        contentTranslations[loc].trim() === sourceContent.trim()
      );
      const hasCopiedExcerpt = allLocales.some((loc) =>
        loc !== sourceLocale &&
        typeof excerptTranslations[loc] === "string" &&
        excerptTranslations[loc].trim() !== "" &&
        excerptTranslations[loc].trim() === sourceExcerpt.trim()
      );

      // Check if we have translations for all locales
      const hasAllTitleTranslations = allLocales.every(locale => 
        titleTranslations[locale] && 
        titleTranslations[locale].trim() !== "" &&
        !titleTranslations[locale].includes("QUERY LENGTH LIMIT") &&
        !titleTranslations[locale].includes("MAX ALLOWED QUERY") &&
        !titleTranslations[locale].includes("500 CHARS")
      );

      const hasAllContentTranslations = allLocales.every(locale => 
        contentTranslations[locale] && 
        contentTranslations[locale].trim() !== "" &&
        !contentTranslations[locale].includes("QUERY LENGTH LIMIT") &&
        !contentTranslations[locale].includes("MAX ALLOWED QUERY") &&
        !contentTranslations[locale].includes("500 CHARS")
      );

      // If title or content translations are missing or invalid, need translation
      return !hasAllTitleTranslations || !hasAllContentTranslations || hasCopiedTitle || hasCopiedContent || hasCopiedExcerpt;
    };

    // Helper function to clean error messages
    const cleanErrorMessage = (text: string): string => {
      if (!text || typeof text !== "string") return text || "";
      const errorPatterns = [
        /QUERY LENGTH LIMIT EXCEEDED[^<]*/gi,
        /MAX ALLOWED QUERY[^<]*/gi,
        /500 CHARS[^<]*/gi,
      ];
      let cleaned = text;
      errorPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, "");
      });
      return cleaned.trim();
    };

    // Process each post
    for (const post of allPosts) {
      try {
        // Check if post needs translation
        if (!needsTranslation(post)) {
          console.log(`[TRANSLATE-ALL] Post ${post.slug || post._id} already has valid translations, skipping`);
          skipped++;
          continue;
        }

        // Determine source locale
        const sourceLocale = ((post.locale || "me") as Locale);
        const sourceTitle = post.title || "";
        const sourceContent = post.content || "";
        const sourceExcerpt = post.excerpt || "";

        if (!sourceTitle && !sourceContent) {
          console.log(`[TRANSLATE-ALL] Post ${post.slug || post._id} has no title or content, skipping`);
          skipped++;
          continue;
        }

        console.log(`[TRANSLATE-ALL] Translating post ${post.slug || post._id} (locale: ${sourceLocale})`);

        // Initialize translations with existing values or source values
        const existingMetadata = post.metadata || {};
        let titleTranslations: Record<Locale, string> = existingMetadata.titleTranslations || {
          me: sourceTitle,
          en: sourceTitle,
          it: sourceTitle,
          sq: sourceTitle,
        };
        let contentTranslations: Record<Locale, string> = existingMetadata.contentTranslations || {
          me: sourceContent,
          en: sourceContent,
          it: sourceContent,
          sq: sourceContent,
        };
        let excerptTranslations: Record<Locale, string> = existingMetadata.excerptTranslations || {
          me: sourceExcerpt,
          en: sourceExcerpt,
          it: sourceExcerpt,
          sq: sourceExcerpt,
        };

        // Translate title
        if (sourceTitle && sourceTitle.trim()) {
          try {
            const newTitleTranslations = await autoTranslate(sourceTitle.trim(), sourceLocale);
            // Only update translations that are valid
            for (const locale of allLocales) {
              if (newTitleTranslations[locale] && 
                  newTitleTranslations[locale] !== sourceTitle &&
                  !newTitleTranslations[locale].includes("QUERY LENGTH LIMIT") &&
                  !newTitleTranslations[locale].includes("MAX ALLOWED QUERY") &&
                  !newTitleTranslations[locale].includes("500 CHARS")) {
                titleTranslations[locale] = cleanErrorMessage(newTitleTranslations[locale]);
              }
            }
          } catch (error) {
            console.error(`[TRANSLATE-ALL] Error translating title for post ${post.slug || post._id}:`, error);
          }
        }

        // Translate content
        if (sourceContent && sourceContent.trim()) {
          try {
            const contentHTML = sourceContent.trim();
            let newContentTranslations: Record<Locale, string>;
            
            // Check if content is HTML or plain text
            if (contentHTML.includes("<") && contentHTML.includes(">")) {
              // It's HTML, use translateHTML
              newContentTranslations = await translateHTML(contentHTML, sourceLocale);
            } else {
              // Plain text, use autoTranslate
              newContentTranslations = await autoTranslate(contentHTML, sourceLocale);
            }

            // Only update translations that are valid
            for (const locale of allLocales) {
              if (newContentTranslations[locale] && 
                  newContentTranslations[locale] !== sourceContent &&
                  !newContentTranslations[locale].includes("QUERY LENGTH LIMIT") &&
                  !newContentTranslations[locale].includes("MAX ALLOWED QUERY") &&
                  !newContentTranslations[locale].includes("500 CHARS")) {
                contentTranslations[locale] = cleanErrorMessage(newContentTranslations[locale]);
              }
            }
          } catch (error) {
            console.error(`[TRANSLATE-ALL] Error translating content for post ${post.slug || post._id}:`, error);
          }
        }

        // Translate excerpt
        if (sourceExcerpt && sourceExcerpt.trim()) {
          try {
            const excerptText = sourceExcerpt.trim();
            let newExcerptTranslations: Record<Locale, string>;
            
            // Check if excerpt is HTML or plain text
            if (excerptText.includes("<") && excerptText.includes(">")) {
              // HTML excerpt
              newExcerptTranslations = await translateHTML(excerptText, sourceLocale);
            } else {
              // Plain text excerpt
              newExcerptTranslations = await autoTranslate(excerptText, sourceLocale);
            }

            // Only update translations that are valid
            for (const locale of allLocales) {
              if (newExcerptTranslations[locale] && 
                  newExcerptTranslations[locale] !== sourceExcerpt &&
                  !newExcerptTranslations[locale].includes("QUERY LENGTH LIMIT") &&
                  !newExcerptTranslations[locale].includes("MAX ALLOWED QUERY") &&
                  !newExcerptTranslations[locale].includes("500 CHARS")) {
                excerptTranslations[locale] = cleanErrorMessage(newExcerptTranslations[locale]);
              }
            }
          } catch (error) {
            console.error(`[TRANSLATE-ALL] Error translating excerpt for post ${post.slug || post._id}:`, error);
          }
        }

        // Update post with translations
        await collection.updateOne(
          { _id: post._id },
          {
            $set: {
              metadata: {
                ...existingMetadata,
                titleTranslations,
                contentTranslations,
                excerptTranslations,
              },
              updatedAt: new Date(),
            },
          }
        );

        translated++;
        console.log(`[TRANSLATE-ALL] Successfully translated post ${post.slug || post._id}`);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[TRANSLATE-ALL] Error processing post ${post._id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      total: allPosts.length,
      translated,
      skipped,
      errors,
      message: `Translated ${translated} posts. ${skipped} posts already had valid translations. ${errors} errors occurred.`,
    });
  } catch (error: any) {
    console.error("Translate-all error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Translation failed" },
      { status: 500 }
    );
  }
}
