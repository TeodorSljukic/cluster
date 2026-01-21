import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
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

    // Decode filename in case it's URL encoded
    const decodedFilename = decodeURIComponent(filename);

    // Prevent directory traversal
    if (decodedFilename.includes("..") || decodedFilename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, decodedFilename);

    try {
      await unlink(filepath);
      return NextResponse.json({ success: true, message: "File deleted successfully" });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      throw error;
    }
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
