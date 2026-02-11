import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const collection = await getCollection("users");
    const users = await collection.find({}).project({ password: 0 }).toArray();

    return NextResponse.json({
      users: users.map((user: any) => {
        // Return all fields except password
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          _id: user._id.toString(),
          createdAt: user.createdAt?.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
          lastActivity: user.lastActivity?.toISOString(),
        };
      }),
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
