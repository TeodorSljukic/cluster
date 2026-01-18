import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { Post } from "@/models/Post";

// GET - Fetch all posts (with optional filtering by type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // news, event, resource, skill
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
    const existing = await collection.findOne({ slug: body.slug, locale: locale });
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

    // Get locale from body or default to "me"
    const locale = body.locale || "me";

    const post: Post = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || "",
      featuredImage: body.featuredImage || "",
      type: body.type,
      status: body.status || "draft",
      locale: locale,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === "published" ? now : undefined,
      eventDate: eventDate,
      eventLocation: body.eventLocation || "",
    };

    const result = await collection.insertOne(post);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString(),
      eventDate: post.eventDate?.toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
