import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { autoTranslate } from "@/lib/translate";
import { type Locale } from "@/lib/i18n";
import { Post } from "@/models/Post";

// This endpoint helps migrate existing posts to the new structure
// and creates translations for all languages
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const collection = await getCollection("posts");
    const allPosts = await collection.find({}).toArray();

    let migrated = 0;
    let skipped = 0;
    let translated = 0;
    const allLocales: Locale[] = ["me", "en", "it", "sq"];

    // Group posts by slug to find unique posts
    const postsBySlug = new Map<string, any[]>();
    
    for (const post of allPosts) {
      const slug = post.slug || `post-${post._id.toString()}`;
      if (!postsBySlug.has(slug)) {
        postsBySlug.set(slug, []);
      }
      postsBySlug.get(slug)!.push(post);
    }

    // Process each unique post (by slug)
    for (const [slug, posts] of postsBySlug.entries()) {
      // Find the source post (prefer one with locale, or first one)
      const sourcePost = posts.find(p => p.locale) || posts[0];
      const existingLocales = new Set(posts.map((p: any) => p.locale || "me"));
      
      // Ensure source post has required fields
      const updates: any = {};
      if (!sourcePost.type) {
        const title = (sourcePost.title || "").toLowerCase();
        if (title.includes("event") || title.includes("dogadjaj")) {
          updates.type = "event";
        } else {
          updates.type = "news";
        }
        migrated++;
      }
      if (!sourcePost.status) {
        updates.status = "draft";
        migrated++;
      }
      if (!sourcePost.createdAt) {
        updates.createdAt = new Date();
        migrated++;
      }
      if (!sourcePost.updatedAt) {
        updates.updatedAt = sourcePost.createdAt || new Date();
        migrated++;
      }
      if (sourcePost.status === "published" && !sourcePost.publishedAt) {
        updates.publishedAt = sourcePost.createdAt || new Date();
        migrated++;
      }
      if (!sourcePost.locale) {
        updates.locale = "me"; // Default locale
        migrated++;
      }

      if (Object.keys(updates).length > 0) {
        await collection.updateOne(
          { _id: sourcePost._id },
          { $set: updates }
        );
      }

      // Determine source locale
      const sourceLocale = (sourcePost.locale || "me") as Locale;
      const sourceTitle = sourcePost.title || "";
      const sourceContent = sourcePost.content || "";
      const sourceExcerpt = sourcePost.excerpt || "";

      // Translate content
      let titleTranslations: Record<Locale, string> = {
        me: sourceTitle,
        en: sourceTitle,
        it: sourceTitle,
        sq: sourceTitle,
      };
      let contentTranslations: Record<Locale, string> = {
        me: sourceContent,
        en: sourceContent,
        it: sourceContent,
        sq: sourceContent,
      };
      let excerptTranslations: Record<Locale, string> = {
        me: sourceExcerpt,
        en: sourceExcerpt,
        it: sourceExcerpt,
        sq: sourceExcerpt,
      };

      try {
        // Translate title
        if (sourceTitle) {
          titleTranslations = await autoTranslate(sourceTitle, sourceLocale);
        }
        
        // Translate content (HTML)
        if (sourceContent) {
          const textContent = sourceContent.replace(/<[^>]*>/g, " ").trim();
          if (textContent) {
            contentTranslations = await autoTranslate(textContent, sourceLocale);
          }
        }
        
        // Translate excerpt
        if (sourceExcerpt) {
          excerptTranslations = await autoTranslate(sourceExcerpt, sourceLocale);
        }
      } catch (error) {
        console.error(`Translation error for post ${slug}:`, error);
        // Continue with original text if translation fails
      }

      // Create missing locale versions
      const postsToInsert: Omit<Post, "_id">[] = [];
      
      for (const targetLocale of allLocales) {
        // Skip if this locale already exists
        if (existingLocales.has(targetLocale)) {
          // Update existing post with translations in metadata
          await collection.updateOne(
            { slug, locale: targetLocale },
            {
              $set: {
                metadata: {
                  titleTranslations,
                  contentTranslations,
                  excerptTranslations,
                },
              },
            }
          );
          continue;
        }

        // Check if post already exists for this locale
        const existing = await collection.findOne({ slug, locale: targetLocale });
        if (existing) {
          continue;
        }

        // Create new post for this locale
        const newPost: Omit<Post, "_id"> = {
          title: titleTranslations[targetLocale] || sourceTitle,
          slug: slug,
          content: contentTranslations[targetLocale] || sourceContent,
          excerpt: excerptTranslations[targetLocale] || sourceExcerpt,
          featuredImage: sourcePost.featuredImage || "",
          type: sourcePost.type || "news",
          status: sourcePost.status || "draft",
          locale: targetLocale,
          createdAt: sourcePost.createdAt || new Date(),
          updatedAt: new Date(),
          publishedAt: sourcePost.publishedAt,
          eventDate: sourcePost.eventDate,
          eventLocation: sourcePost.eventLocation || "",
          metadata: {
            titleTranslations,
            contentTranslations,
            excerptTranslations,
          },
        };

        postsToInsert.push(newPost);
      }

      // Insert new posts
      if (postsToInsert.length > 0) {
        await collection.insertMany(postsToInsert);
        translated += postsToInsert.length;
      }
    }

    return NextResponse.json({
      success: true,
      total: allPosts.length,
      uniquePosts: postsBySlug.size,
      migrated,
      skipped,
      translated,
      message: `Migrated ${migrated} fields, created ${translated} translated posts across ${postsBySlug.size} unique posts`,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
