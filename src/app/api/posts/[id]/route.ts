import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Post } from "@/models/Post";

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

    // Only update fields that are provided
    if (body.title !== undefined) update.title = body.title;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.content !== undefined) update.content = body.content || ""; // Allow empty content
    if (body.excerpt !== undefined) update.excerpt = body.excerpt || "";
    if (body.featuredImage !== undefined) update.featuredImage = body.featuredImage || "";
    if (body.status !== undefined) update.status = body.status;
    if (body.type !== undefined) update.type = body.type;
    if (body.locale !== undefined) update.locale = body.locale;
    if (eventDate !== undefined) update.eventDate = eventDate;
    if (body.eventLocation !== undefined) update.eventLocation = body.eventLocation || "";

    // If status changed to published, set publishedAt
    if (body.status === "published" && existing.status !== "published") {
      update.publishedAt = new Date();
    }

    const result = await collection.updateOne(
      { _id: postId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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
    });
  } catch (error: any) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete post
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

    const result = await collection.deleteOne({
      _id: postId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
