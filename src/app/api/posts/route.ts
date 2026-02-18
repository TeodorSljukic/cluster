import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { Post } from "@/models/Post";
import { autoTranslate } from "@/lib/translate";
import { type Locale } from "@/lib/i18n";

// GET - Fetch all posts (with optional filtering by type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // news, event
    const status = searchParams.get("status"); // null means show all
    const locale = searchParams.get("locale"); // me, en, it, sq
    const limit = parseInt(searchParams.get("limit") || "100"); // Increased limit for admin
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const collection = await getCollection("posts");

    const query: any = {};
    // Only filter by type if provided and not "all"
    if (type && type !== "all") {
      query.type = type;
    }
    // Only filter by status if explicitly provided
    if (status && status !== "") {
      query.status = status;
    }
    // Filter by locale if provided
    if (locale) {
      query.locale = locale;
    }

    const posts = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      posts: posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt?.toISOString(),
        updatedAt: post.updatedAt?.toISOString(),
        publishedAt: post.publishedAt?.toISOString(),
        eventDate: post.eventDate?.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': status === 'published' 
          ? 'public, s-maxage=60, stale-while-revalidate=120'
          : 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const collection = await getCollection("posts");
    const locale = body.locale || "me";

    // Validate required fields
    if (!body.title || !body.type || !body.slug) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, slug" },
        { status: 400 }
      );
    }
    
    // Content can be empty HTML, so just check if it exists (even if empty string)
    if (body.content === undefined || body.content === null) {
      return NextResponse.json(
        { error: "Content field is required" },
        { status: 400 }
      );
    }

    // Check if slug already exists for this locale
    const existing = await collection.findOne({ slug: body.slug, locale });
    if (existing) {
      return NextResponse.json(
        { error: `Slug already exists for ${locale} locale` },
        { status: 400 }
      );
    }

    const now = new Date();
    
    // Convert eventDate from string to Date if provided
    let eventDate: Date | undefined;
    if (body.eventDate) {
      eventDate = typeof body.eventDate === "string" 
        ? new Date(body.eventDate) 
        : body.eventDate;
    }

    // Auto-translate title, content, and excerpt to all languages
    const sourceLocale = locale as Locale;
    const allLocales: Locale[] = ["me", "en", "it", "sq"];
    
    let titleTranslations: Record<Locale, string> = {
      me: body.title,
      en: body.title,
      it: body.title,
      sq: body.title,
    };
    let contentTranslations: Record<Locale, string> = {
      me: body.content,
      en: body.content,
      it: body.content,
      sq: body.content,
    };
    let excerptTranslations: Record<Locale, string> = {
      me: body.excerpt || "",
      en: body.excerpt || "",
      it: body.excerpt || "",
      sq: body.excerpt || "",
    };

    try {
      // Translate title
      if (body.title) {
        titleTranslations = await autoTranslate(body.title, sourceLocale);
      }
      
      // Translate content (HTML)
      if (body.content) {
        // Extract text from HTML for translation
        const textContent = body.content.replace(/<[^>]*>/g, " ").trim();
        if (textContent) {
          const contentTextTranslations = await autoTranslate(textContent, sourceLocale);
          // For now, we'll store the translated text (in production, you'd want to preserve HTML structure)
          contentTranslations = contentTextTranslations;
        }
      }
      
      // Translate excerpt
      if (body.excerpt) {
        excerptTranslations = await autoTranslate(body.excerpt, sourceLocale);
      }
    } catch (error) {
      console.error("Auto-translation error:", error);
      // Continue with original text if translation fails
    }

    // Create posts for all locales
    const postsToInsert: Omit<Post, "_id">[] = [];
    const insertedIds: string[] = [];

    for (const targetLocale of allLocales) {
      // Check if slug already exists for this locale
      const existing = await collection.findOne({ slug: body.slug, locale: targetLocale });
      if (existing) {
        console.warn(`Slug ${body.slug} already exists for locale ${targetLocale}, skipping`);
        continue;
      }

      const post: Omit<Post, "_id"> = {
        title: titleTranslations[targetLocale] || body.title,
        slug: body.slug,
        content: contentTranslations[targetLocale] || body.content,
        excerpt: excerptTranslations[targetLocale] || body.excerpt || "",
        featuredImage: body.featuredImage || "",
        type: body.type,
        status: body.status || "draft",
        locale: targetLocale,
        createdAt: now,
        updatedAt: now,
        publishedAt: body.status === "published" ? now : undefined,
        eventDate: eventDate,
        eventLocation: body.eventLocation || "",
        // Store translations in metadata for reference
        metadata: {
          titleTranslations,
          contentTranslations,
          excerptTranslations,
        },
      };

      postsToInsert.push(post);
    }

    // Insert all posts
    if (postsToInsert.length > 0) {
      const result = await collection.insertMany(postsToInsert);
      // insertMany returns insertedIds as an object with numeric keys
      insertedIds.push(...Object.values(result.insertedIds).map((id: any) => id.toString()));
    }

    // Return the first inserted post (source locale)
    const firstPost = postsToInsert.find(p => p.locale === sourceLocale) || postsToInsert[0];
    const firstId = insertedIds[0] || "";

    return NextResponse.json({
      _id: firstId,
      ...firstPost,
      createdAt: firstPost.createdAt.toISOString(),
      updatedAt: firstPost.updatedAt.toISOString(),
      publishedAt: firstPost.publishedAt?.toISOString(),
      eventDate: firstPost.eventDate?.toISOString(),
      createdForAllLocales: true,
      insertedCount: insertedIds.length,
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
