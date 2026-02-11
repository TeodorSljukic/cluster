import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { Media } from "@/models/Media";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size (max 5MB for base64 encoding)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large", 
        details: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (5MB)` 
      }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    
    // Create data URI for easy display
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Generate unique filename for reference
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${originalName}`;

    // Determine file type and extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType = "other";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type === "application/pdf") {
      fileType = "pdf";
    } else if (file.type.includes("document") || file.type.includes("word") || file.type.includes("text")) {
      fileType = "document";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
    } else if (file.type.startsWith("audio/")) {
      fileType = "audio";
    } else if (file.type.includes("zip") || file.type.includes("archive") || file.type.includes("compressed")) {
      fileType = "archive";
    }

    // Save to database
    const mediaCollection = await getCollection("media");
    const mediaDoc: Omit<Media, "_id"> = {
      filename,
      originalName: file.name,
      url: dataUri,
      size: file.size,
      type: fileType,
      extension,
      createdAt: new Date(),
      createdBy: user.userId,
    };

    const result = await mediaCollection.insertOne(mediaDoc);

    // Return data URI as URL
    return NextResponse.json({
      url: dataUri,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: fileType,
      extension,
      _id: result.insertedId.toString(),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
