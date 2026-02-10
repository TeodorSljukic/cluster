import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // TODO: Implement email sending logic here
    // For now, we'll just log it and return success
    console.log("Contact form submission:", { name, email, message });

    // In production, you would send an email here using a service like:
    // - SendGrid
    // - Nodemailer
    // - AWS SES
    // etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
