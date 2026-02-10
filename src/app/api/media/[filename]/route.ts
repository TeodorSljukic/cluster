import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await requireAdmin();

    const { filename } = await params;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Since we now use base64 encoding and store files directly in the database,
    // files are not stored on the filesystem anymore.
    // Files are stored as data URIs in posts, user profiles, etc.
    // To delete a file, you would need to remove it from the respective content (post, profile, etc.).
    return NextResponse.json({ 
      success: true, 
      message: "File deletion is handled through content management. Files are stored as base64 in the database, not on the filesystem." 
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
