import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/auth";
import { lstat } from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const uploadsDir = join(process.cwd(), "public", "uploads");

    try {
      const files = await readdir(uploadsDir);
      const fileList = await Promise.all(
        files.map(async (filename) => {
          const filepath = join(uploadsDir, filename);
          const stats = await lstat(filepath);
          
          // Skip directories (like chat folder)
          if (stats.isDirectory()) {
            return null;
          }
          
          // Skip files in chat folder
          if (filename.includes("chat") || filepath.includes("chat")) {
            return null;
          }
          
          // Get file extension to determine type
          const ext = filename.split(".").pop()?.toLowerCase() || "";
          const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
          const isPdf = ext === "pdf";
          const isDocument = ["doc", "docx", "txt", "rtf"].includes(ext);
          const isVideo = ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext);
          const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext);
          const isArchive = ["zip", "rar", "7z", "tar", "gz"].includes(ext);

          return {
            filename,
            url: `/uploads/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            type: isImage ? "image" : isPdf ? "pdf" : isDocument ? "document" : isVideo ? "video" : isAudio ? "audio" : isArchive ? "archive" : "other",
            extension: ext,
          };
        })
      );
      
      // Filter out null values (directories and chat files)
      const filteredList = fileList.filter((file) => file !== null) as Array<{
        filename: string;
        url: string;
        size: number;
        createdAt: string;
        type: string;
        extension: string;
      }>;

      // Sort by creation date (newest first)
      filteredList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ files: filteredList });
    } catch (error) {
      // Directory doesn't exist yet
      return NextResponse.json({ files: [] });
    }
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
