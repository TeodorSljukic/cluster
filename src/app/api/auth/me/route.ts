import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

const CACHE_HEADER = "private, max-age=30, stale-while-revalidate=60";

export async function GET(request: NextRequest) {
  // Skip DB work for Next.js prefetch requests.
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose")?.includes("prefetch");

  if (isPrefetch) {
    return NextResponse.json({ user: null }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ user: null }, {
        headers: { "Cache-Control": CACHE_HEADER },
      });
    }

    const collection = await getCollection("users");
    const user = await collection.findOne({
      _id: new ObjectId(currentUser.userId),
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json(
      {
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
          registeredPlatforms: user.registeredPlatforms || {
            lms: false,
            ecommerce: false,
            dms: false,
          },
        },
      },
      { headers: { "Cache-Control": CACHE_HEADER } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
