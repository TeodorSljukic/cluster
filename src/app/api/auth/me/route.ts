import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ user: null });
    }

    const collection = await getCollection("users");
    const user = await collection.findOne({
      _id: new ObjectId(currentUser.userId),
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName || user.username,
        organization: user.organization,
        location: user.location,
        role_custom: user.role_custom,
        interests: user.interests,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
