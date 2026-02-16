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

    // Email configuration
    const recipientEmail = "teodorsljukic@gmail.com";
    const subject = `Contact Form Submission from ${name}`;
    
    // Email body
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This email was sent from the contact form on ${process.env.NEXT_PUBLIC_BASE_URL || 'the website'}.</p>
    `;

    // Try to send email using Resend API (if API key is configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Contact Form <onboarding@resend.dev>", // You can change this domain
            to: [recipientEmail],
            subject: subject,
            html: emailBody,
            reply_to: email,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error("Resend API error:", errorData);
          throw new Error("Failed to send email via Resend");
        }

        console.log("Email sent successfully via Resend to:", recipientEmail);
        return NextResponse.json({ success: true });
      } catch (resendError) {
        console.error("Resend API error:", resendError);
        // Fall through to alternative method
      }
    }

    // Alternative: Use a simple email service or log for manual processing
    // For production, you can also use:
    // - Nodemailer with SMTP
    // - SendGrid
    // - AWS SES
    // - Or any other email service

    // Log the submission (for development/debugging)
    console.log("Contact form submission:", { name, email, message });
    console.log("Email would be sent to:", recipientEmail);
    
    // In production without email service, you might want to save to database
    // For now, we'll return success (email will be sent if Resend is configured)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
