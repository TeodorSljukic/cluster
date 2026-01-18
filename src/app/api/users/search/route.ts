import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET - Pretraga korisnika
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const db = await getDb();

    // Pretraga po username, email, displayName
    const users = await db
      .collection("users")
      .find({
        _id: { $ne: new ObjectId(currentUser.userId) }, // Isključi trenutnog korisnika
        $or: [
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { displayName: { $regex: query, $options: "i" } },
        ],
      })
      .limit(20)
      .toArray();

    // Ukloni password iz rezultata
    const sanitizedUsers = users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      profilePicture: u.profilePicture,
      headline: u.headline,
      organization: u.organization,
      location: u.location,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
