import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Since we now use base64 encoding and store files directly in the database,
    // we don't have a filesystem-based media library anymore.
    // Files are stored as data URIs in posts, user profiles, etc.
    // Return empty array for now - media can be managed through the respective content types.
    return NextResponse.json({ files: [] });
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
