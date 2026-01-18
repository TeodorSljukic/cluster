import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET - Fetch current user profile
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCollection("users");
    const user = await collection.findOne({
      _id: new ObjectId(currentUser.userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      ...userWithoutPassword,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: any = await request.json();
    const collection = await getCollection("users");

    const update: any = {
      updatedAt: new Date(),
    };

    // Update only provided fields
    if (body.displayName !== undefined) update.displayName = body.displayName;
    if (body.headline !== undefined) update.headline = body.headline;
    if (body.about !== undefined) update.about = body.about;
    if (body.organization !== undefined) update.organization = body.organization;
    if (body.location !== undefined) update.location = body.location;
    if (body.role_custom !== undefined) update.role_custom = body.role_custom;
    if (body.interests !== undefined) update.interests = body.interests;
    if (body.profilePicture !== undefined) update.profilePicture = body.profilePicture;
    if (body.coverImage !== undefined) update.coverImage = body.coverImage;
    if (body.experience !== undefined) update.experience = body.experience;
    if (body.education !== undefined) update.education = body.education;
    if (body.skills !== undefined) update.skills = body.skills;
    if (body.website !== undefined) update.website = body.website;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.linkedin !== undefined) update.linkedin = body.linkedin;
    if (body.twitter !== undefined) update.twitter = body.twitter;

    const result = await collection.updateOne(
      { _id: new ObjectId(currentUser.userId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await collection.findOne({
      _id: new ObjectId(currentUser.userId),
    });

    const { password, ...userWithoutPassword } = updated!;

    return NextResponse.json({
      ...userWithoutPassword,
      _id: userWithoutPassword._id.toString(),
      createdAt: userWithoutPassword.createdAt?.toISOString(),
      updatedAt: userWithoutPassword.updatedAt?.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
