import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, displayName, organization, location, role_custom, interests } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: username, email, password" },
        { status: 400 }
      );
    }

    const collection = await getCollection("users");

    // Check if username or email already exists
    const existing = await collection.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user:
    // - if there is no admin in DB (common after migrations), make this user admin
    // - otherwise normal user
    const adminExists = (await collection.countDocuments({ role: "admin" })) > 0;
    const role = adminExists ? "user" : "admin";

    const now = new Date();
    const user: Omit<User, "_id"> = {
      username,
      email,
      password: hashedPassword,
      role,
      displayName: displayName || username,
      organization,
      location,
      role_custom,
      interests,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(user);

    // Create token
    const token = createToken({
      userId: result.insertedId.toString(),
      username: user.username,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        _id: result.insertedId.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
