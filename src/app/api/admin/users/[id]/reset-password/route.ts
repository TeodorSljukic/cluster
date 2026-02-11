import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// POST - Send password reset link to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin();

    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const collection = await getCollection("users");
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Save reset token to database
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
        },
      }
    );

    // Generate reset link (default to 'me' locale, user can change it)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/me/reset-password?token=${resetToken}`;

    // In production, you would send an email here
    // For now, we'll return the link so admin can copy it
    console.log(`[ADMIN RESET PASSWORD] Reset link for ${user.email}: ${resetLink}`);

    return NextResponse.json({
      success: true,
      message: "Password reset link generated",
      resetLink: resetLink,
      email: user.email,
      // In production, remove resetLink from response and send email instead
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error generating reset password link:", error);
    return NextResponse.json(
      { error: "Failed to generate reset password link" },
      { status: 500 }
    );
  }
}
