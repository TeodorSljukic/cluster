import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";

    const db = await getDb();

    const filter: any = {};
    if (country) filter.country = country;
    if (city) filter.city = city;

    const skip = (Math.max(page, 1) - 1) * limit;

    const users = await db
      .collection("users")
      .find(filter)
      .project({
        password: 0,
        // only return public fields
        username: 1,
        displayName: 1,
        profilePicture: 1,
        organization: 1,
        location: 1,
        country: 1,
        city: 1,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("users").countDocuments(filter);

    return NextResponse.json({
      users: users.map((u: any) => ({
        _id: u._id.toString(),
        username: u.username,
        displayName: u.displayName,
        profilePicture: u.profilePicture,
        organization: u.organization,
        location: u.location,
        country: u.country,
        city: u.city,
      })),
      page,
      limit,
      total,
    });
  } catch (err) {
    console.error("Error fetching users list:", err);
    return NextResponse.json({ users: [], page: 1, limit: 0, total: 0 }, { status: 500 });
  }
}

