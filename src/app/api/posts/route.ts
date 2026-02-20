import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { Post } from "@/models/Post";
import { autoTranslate, translateHTML } from "@/lib/translate";
import { type Locale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

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
    
    // Get current user for publishedBy
    const currentUser = await getCurrentUser();
    let publishedBy: string | undefined;
    let publishedByName: string | undefined;
    
    if (currentUser) {
      publishedBy = currentUser.userId;
      // Get user display name
      try {
        const usersCollection = await getCollection("users");
        const userId = new ObjectId(currentUser.userId);
        const user = await usersCollection.findOne({ _id: userId });
        publishedByName = user?.displayName || user?.username || undefined;
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    }
    
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
      console.log(`[POST CREATE] Starting translation for locale ${sourceLocale}`);
      
      // Translate title
      if (body.title && body.title.trim()) {
        console.log(`[POST CREATE] Translating title: "${body.title.substring(0, 50)}..."`);
        titleTranslations = await autoTranslate(body.title.trim(), sourceLocale);
        console.log(`[POST CREATE] Title translations:`, Object.keys(titleTranslations));
      }
      
      // Translate content (HTML) - use translateHTML to preserve structure
      if (body.content && body.content.trim()) {
        const contentHTML = body.content.trim();
        console.log(`[POST CREATE] Translating content (length: ${contentHTML.length})`);
        // Check if content is HTML or plain text
        if (contentHTML.includes("<") && contentHTML.includes(">")) {
          // It's HTML, use translateHTML
          console.log(`[POST CREATE] Content is HTML, using translateHTML`);
          contentTranslations = await translateHTML(contentHTML, sourceLocale);
        } else {
          // Plain text, use autoTranslate
          console.log(`[POST CREATE] Content is plain text, using autoTranslate`);
          contentTranslations = await autoTranslate(contentHTML, sourceLocale);
        }
        console.log(`[POST CREATE] Content translations:`, Object.keys(contentTranslations));
      }
      
      // Translate excerpt - check if it's HTML or plain text
      if (body.excerpt && body.excerpt.trim()) {
        const excerptText = body.excerpt.trim();
        console.log(`[POST CREATE] Translating excerpt: "${excerptText.substring(0, 50)}..."`);
        if (excerptText.includes("<") && excerptText.includes(">")) {
          // HTML excerpt
          console.log(`[POST CREATE] Excerpt is HTML, using translateHTML`);
          excerptTranslations = await translateHTML(excerptText, sourceLocale);
        } else {
          // Plain text excerpt
          console.log(`[POST CREATE] Excerpt is plain text, using autoTranslate`);
          excerptTranslations = await autoTranslate(excerptText, sourceLocale);
        }
        console.log(`[POST CREATE] Excerpt translations:`, Object.keys(excerptTranslations));
      }
      
      // Clean any error messages from translations
      const cleanTranslation = (translation: string): string => {
        if (!translation || typeof translation !== "string") return translation;
        if (translation.includes("QUERY LENGTH LIMIT") || 
            translation.includes("MAX ALLOWED QUERY") ||
            translation.includes("500 CHARS")) {
          return ""; // Return empty string if error found
        }
        return translation;
      };

      // Clean translations
      for (const locale of ["me", "en", "it", "sq"] as Locale[]) {
        if (titleTranslations[locale]) {
          titleTranslations[locale] = cleanTranslation(titleTranslations[locale]);
        }
        if (contentTranslations[locale]) {
          contentTranslations[locale] = cleanTranslation(contentTranslations[locale]);
        }
        if (excerptTranslations[locale]) {
          excerptTranslations[locale] = cleanTranslation(excerptTranslations[locale]);
        }
      }

      console.log(`[POST CREATE] Translation completed successfully`);
      console.log(`[POST CREATE] Title translations sample:`, {
        me: titleTranslations.me?.substring(0, 30),
        en: titleTranslations.en?.substring(0, 30),
        it: titleTranslations.it?.substring(0, 30),
        sq: titleTranslations.sq?.substring(0, 30),
      });
    } catch (error) {
      console.error("[POST CREATE] Auto-translation error:", error);
      // Continue with original text if translation fails
    }

    // Create only one post for the current locale, but store translations in metadata
    // Translations can be used to create other locale versions later if needed
    const post: Omit<Post, "_id"> = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || "",
      featuredImage: body.featuredImage || "",
      type: body.type,
      status: body.status || "draft",
      locale: sourceLocale,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === "published" ? now : undefined,
      eventDate: eventDate,
      eventLocation: body.eventLocation || "",
      viewCount: 0,
      publishedBy: body.status === "published" ? publishedBy : undefined,
      publishedByName: body.status === "published" ? publishedByName : undefined,
      // Store translations in metadata - these are automatically generated and can be used later
      metadata: {
        titleTranslations,
        contentTranslations,
        excerptTranslations,
      },
    };

    // Insert the post
    const result = await collection.insertOne(post);
    const insertedId = result.insertedId.toString();

    console.log(`[POST CREATE] Created post ${insertedId} for locale ${sourceLocale} with translations:`, {
      hasTitleTranslations: !!titleTranslations,
      hasContentTranslations: !!contentTranslations,
      hasExcerptTranslations: !!excerptTranslations,
      titleTranslationKeys: Object.keys(titleTranslations || {}),
      contentTranslationKeys: Object.keys(contentTranslations || {}),
      excerptTranslationKeys: Object.keys(excerptTranslations || {}),
    });

    return NextResponse.json({
      _id: insertedId,
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      eventDate: post.eventDate?.toISOString(),
      createdForAllLocales: false,
      insertedCount: 1,
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
