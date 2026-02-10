import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const collection = await getCollection("users");
    const user = await collection.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // In production, you would send an email here
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

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

      // In production, send email with reset link
      // For now, we'll just log it (in development)
      console.log(`[FORGOT PASSWORD] Reset token for ${email}: ${resetToken}`);
      console.log(`[FORGOT PASSWORD] Reset link: /reset-password?token=${resetToken}`);
      
      // TODO: Send email with reset link
      // await sendEmail({
      //   to: email,
      //   subject: "Reset Your Password",
      //   html: `
      //     <p>You requested to reset your password.</p>
      //     <p>Click the link below to reset your password:</p>
      //     <a href="${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}">Reset Password</a>
      //     <p>This link will expire in 1 hour.</p>
      //   `,
      // });
    }

    // Always return success (security best practice)
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
