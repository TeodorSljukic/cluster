import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const collection = await getCollection("users");
    const users = await collection.find({}).toArray();

    return NextResponse.json({
      users: users.map((user) => ({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName || user.username,
        organization: user.organization,
        location: user.location,
        createdAt: user.createdAt?.toISOString(),
      })),
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
