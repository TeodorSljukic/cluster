import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Post } from "@/models/Post";
import { autoTranslate, translateHTML } from "@/lib/translate";
import { type Locale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";

// GET - Fetch single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const collection = await getCollection("posts");
    
    // Handle params as Promise (Next.js 16) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const postIdString = resolvedParams.id;
    
    // Validate ObjectId format
    let postId: ObjectId;
    try {
      if (!ObjectId.isValid(postIdString)) {
        return NextResponse.json({ error: `Invalid post ID format: ${postIdString}` }, { status: 400 });
      }
      postId = new ObjectId(postIdString);
    } catch (error: any) {
      console.error("ObjectId creation error:", error);
      return NextResponse.json({ error: `Invalid post ID: ${postIdString}` }, { status: 400 });
    }
    
    const post = await collection.findOne({
      _id: postId,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      eventDate: post.eventDate?.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body: any = await request.json();
    const collection = await getCollection("posts");

    // Handle params as Promise (Next.js 16) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const postIdString = resolvedParams.id;

    // Validate ObjectId format
    console.log("PUT request - params.id:", postIdString, "type:", typeof postIdString, "length:", postIdString?.length);
    let postId: ObjectId;
    try {
      if (!postIdString || postIdString.trim() === "") {
        return NextResponse.json({ error: `Post ID is required` }, { status: 400 });
      }
      if (!ObjectId.isValid(postIdString)) {
        console.error("Invalid ObjectId format:", postIdString);
        return NextResponse.json({ error: `Invalid post ID format: ${postIdString}` }, { status: 400 });
      }
      postId = new ObjectId(postIdString);
      console.log("ObjectId created successfully:", postId.toString());
    } catch (error: any) {
      console.error("ObjectId creation error:", error, "params.id:", postIdString);
      return NextResponse.json({ error: `Invalid post ID: ${postIdString}` }, { status: 400 });
    }

    // Check if post exists
    const existing = await collection.findOne({
      _id: postId,
    });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If slug is being updated, check for conflicts (considering locale)
    const locale = body.locale || existing.locale || "me";
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await collection.findOne({ slug: body.slug, locale: locale });
      if (slugExists && slugExists._id.toString() !== postIdString) {
        return NextResponse.json(
          { error: `Slug already exists for ${locale} locale` },
          { status: 400 }
        );
      }
    }

    // Convert eventDate from string to Date if provided
    let eventDate: Date | undefined;
    if (body.eventDate !== undefined) {
      if (body.eventDate === null || body.eventDate === "") {
        eventDate = undefined;
      } else {
        eventDate = typeof body.eventDate === "string" 
          ? new Date(body.eventDate) 
          : body.eventDate;
      }
    }

    // Validate required fields if they're being updated
    if (body.title !== undefined && !body.title) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    if (body.slug !== undefined && !body.slug) {
      return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
    }

    const update: any = {
      updatedAt: new Date(),
    };

    // Get existing metadata or create new
    const existingMetadata = existing.metadata || {};
    let titleTranslations = existingMetadata.titleTranslations || {
      me: existing.title || "",
      en: existing.title || "",
      it: existing.title || "",
      sq: existing.title || "",
    };
    let contentTranslations = existingMetadata.contentTranslations || {
      me: existing.content || "",
      en: existing.content || "",
      it: existing.content || "",
      sq: existing.content || "",
    };
    let excerptTranslations = existingMetadata.excerptTranslations || {
      me: existing.excerpt || "",
      en: existing.excerpt || "",
      it: existing.excerpt || "",
      sq: existing.excerpt || "",
    };

    // Auto-translate if title, content, or excerpt is being updated
    const sourceLocale = (body.locale || existing.locale || "me") as Locale;
    const allLocales: Locale[] = ["me", "en", "it", "sq"];
    
    // Only update fields that are provided
    if (body.title !== undefined) {
      update.title = body.title;
      // Auto-translate title
      try {
        titleTranslations = await autoTranslate(body.title, sourceLocale);
      } catch (error) {
        console.error("Error translating title:", error);
        titleTranslations[sourceLocale] = body.title;
      }
    }
    
    if (body.slug !== undefined) update.slug = body.slug;
    
    if (body.content !== undefined) {
      update.content = body.content || "";
      // Auto-translate content - use translateHTML to preserve structure
      if (body.content && body.content.trim()) {
        try {
          const contentHTML = body.content.trim();
          // Check if content is HTML or plain text
          if (contentHTML.includes("<") && contentHTML.includes(">")) {
            // It's HTML, use translateHTML
            contentTranslations = await translateHTML(contentHTML, sourceLocale);
          } else {
            // Plain text, use autoTranslate
            contentTranslations = await autoTranslate(contentHTML, sourceLocale);
          }
        } catch (error) {
          console.error("Error translating content:", error);
          contentTranslations[sourceLocale] = body.content;
        }
      }
    }
    
    if (body.excerpt !== undefined) {
      update.excerpt = body.excerpt || "";
      // Auto-translate excerpt - check if HTML or plain text
      if (body.excerpt && body.excerpt.trim()) {
        try {
          const excerptText = body.excerpt.trim();
          if (excerptText.includes("<") && excerptText.includes(">")) {
            // HTML excerpt
            excerptTranslations = await translateHTML(excerptText, sourceLocale);
          } else {
            // Plain text excerpt
            excerptTranslations = await autoTranslate(excerptText, sourceLocale);
          }
        } catch (error) {
          console.error("Error translating excerpt:", error);
          excerptTranslations[sourceLocale] = body.excerpt;
        }
      }
    }
    
    if (body.featuredImage !== undefined) update.featuredImage = body.featuredImage || "";
    if (body.status !== undefined) update.status = body.status;
    if (body.type !== undefined) update.type = body.type;
    if (body.locale !== undefined) update.locale = body.locale;
    if (eventDate !== undefined) update.eventDate = eventDate;
    if (body.eventLocation !== undefined) update.eventLocation = body.eventLocation || "";

    // Update metadata with translations
    update.metadata = {
      ...existingMetadata,
      titleTranslations,
      contentTranslations,
      excerptTranslations,
    };

    // If status changed to published, set publishedAt and publishedBy
    // Also handle republish (when republish flag is true and post is already published)
    const now = new Date();
    const isRepublish = body.republish === true && existing.status === "published";
    if ((body.status === "published" && existing.status !== "published") || isRepublish) {
      update.publishedAt = now;
      
      // Get current user for publishedBy
      const currentUser = await getCurrentUser();
      if (currentUser) {
        update.publishedBy = currentUser.userId;
        // Get user display name
        try {
          const usersCollection = await getCollection("users");
          const userId = new ObjectId(currentUser.userId);
          const user = await usersCollection.findOne({ _id: userId });
          update.publishedByName = user?.displayName || user?.username || undefined;
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      }
    }
    
    // Initialize viewCount if it doesn't exist
    if (existing.viewCount === undefined) {
      update.viewCount = 0;
    }

    // Update the current post
    const result = await collection.updateOne(
      { _id: postId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Find and update all related posts with the same slug (different locales)
    // This ensures all language versions are updated when one is updated
    const slugToUpdate = body.slug !== undefined ? body.slug : existing.slug;
    const updatesForAllLocales: any = {
      updatedAt: now,
    };

    // Update shared fields that should be the same across all locales
    if (body.featuredImage !== undefined) updatesForAllLocales.featuredImage = body.featuredImage || "";
    if (body.status !== undefined) updatesForAllLocales.status = body.status;
    if (body.type !== undefined) updatesForAllLocales.type = body.type;
    if (eventDate !== undefined) updatesForAllLocales.eventDate = eventDate;
    if (body.eventLocation !== undefined) updatesForAllLocales.eventLocation = body.eventLocation || "";
    // Handle republish for all locales
    const isRepublishForAll = body.republish === true && existing.status === "published";
    if (body.status === "published" || isRepublishForAll) {
      updatesForAllLocales.publishedAt = now;
      // Set publishedBy for all locales when publishing or republishing
      if (update.publishedBy) {
        updatesForAllLocales.publishedBy = update.publishedBy;
        updatesForAllLocales.publishedByName = update.publishedByName;
      }
    }

    // Update metadata with translations for all related posts
    updatesForAllLocales.metadata = {
      titleTranslations,
      contentTranslations,
      excerptTranslations,
    };

    // Update all posts with the same slug (different locales)
    await collection.updateMany(
      { slug: slugToUpdate, _id: { $ne: postId } },
      { $set: updatesForAllLocales }
    );

    // Update each locale-specific post with its translated content
    for (const targetLocale of allLocales) {
      if (targetLocale === sourceLocale) continue; // Already updated above

      const localeUpdate: any = {
        title: titleTranslations[targetLocale] || existing.title,
        content: contentTranslations[targetLocale] || existing.content,
        excerpt: excerptTranslations[targetLocale] || existing.excerpt || "",
        updatedAt: now,
      };

      await collection.updateOne(
        { slug: slugToUpdate, locale: targetLocale },
        { $set: localeUpdate }
      );
    }

    const updated = await collection.findOne({
      _id: postId,
    });

    return NextResponse.json({
      ...updated,
      _id: updated!._id.toString(),
      createdAt: updated!.createdAt?.toISOString(),
      updatedAt: updated!.updatedAt?.toISOString(),
      publishedAt: updated!.publishedAt?.toISOString(),
      eventDate: updated!.eventDate?.toISOString(),
      updatedForAllLocales: true,
    });
  } catch (error: any) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete post (and all its locale versions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const collection = await getCollection("posts");
    
    // Handle params as Promise (Next.js 16) or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const postIdString = resolvedParams.id;
    
    let postId: ObjectId;
    try {
      if (!ObjectId.isValid(postIdString)) {
        return NextResponse.json({ error: `Invalid post ID format: ${postIdString}` }, { status: 400 });
      }
      postId = new ObjectId(postIdString);
    } catch (error: any) {
      return NextResponse.json({ error: `Invalid post ID: ${postIdString}` }, { status: 400 });
    }

    // First, find the post to get its slug
    const post = await collection.findOne({ _id: postId });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete all posts with the same slug (all locale versions)
    const result = await collection.deleteMany({
      slug: post.slug,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} post(s) with slug: ${post.slug}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
