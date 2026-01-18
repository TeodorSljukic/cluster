import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// POST - Update user activity
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userId = new ObjectId(user.userId);
    const now = new Date();

    // Update last activity
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          lastActivity: now,
          status: "online",
        },
      }
    );

    return NextResponse.json({ success: true, lastActivity: now });
  } catch (error: any) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// GET - Get user status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate status based on last activity
    let status: "online" | "away" | "offline" = "offline";
    if (user.lastActivity) {
      const now = new Date();
      const diff = now.getTime() - new Date(user.lastActivity).getTime();
      const minutesAgo = diff / (1000 * 60);

      if (minutesAgo < 5) {
        status = "online";
      } else if (minutesAgo < 30) {
        status = "away";
      } else {
        status = "offline";
      }
    }

    return NextResponse.json({
      status,
      lastActivity: user.lastActivity,
    });
  } catch (error: any) {
    console.error("Error getting user status:", error);
    return NextResponse.json(
      { error: "Failed to get user status" },
      { status: 500 }
    );
  }
}
