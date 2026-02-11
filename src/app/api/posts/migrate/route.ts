import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// This endpoint helps migrate existing posts to the new structure
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const collection = await getCollection("posts");
    const allPosts = await collection.find({}).toArray();

    let migrated = 0;
    let skipped = 0;

    for (const post of allPosts) {
      const updates: any = {};

      // If post doesn't have type, try to infer it or set default
      if (!post.type) {
        // Try to infer from title or content
        const title = (post.title || "").toLowerCase();
        if (title.includes("event") || title.includes("dogadjaj")) {
          updates.type = "event";
        } else {
          updates.type = "news"; // Default
        }
        migrated++;
      }

      // Ensure status exists
      if (!post.status) {
        updates.status = "draft";
        migrated++;
      }

      // Ensure dates exist
      if (!post.createdAt) {
        updates.createdAt = new Date();
        migrated++;
      }
      if (!post.updatedAt) {
        updates.updatedAt = post.createdAt || new Date();
        migrated++;
      }

      // If status is published but no publishedAt, set it
      if (post.status === "published" && !post.publishedAt) {
        updates.publishedAt = post.createdAt || new Date();
        migrated++;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await collection.updateOne(
          { _id: post._id },
          { $set: updates }
        );
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      total: allPosts.length,
      migrated,
      skipped,
      message: `Migrated ${migrated} fields across ${allPosts.length} posts`,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
