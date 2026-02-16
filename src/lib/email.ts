/**
 * Email sending utility
 * Supports multiple email services as fallback
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, from = "ABGC <onboarding@resend.dev>", replyTo } = options;
  
  // Try Resend API first
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    try {
      console.log("📧 Attempting to send email via Resend API...");
      console.log("   To:", Array.isArray(to) ? to.join(", ") : to);
      console.log("   Subject:", subject);
      
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          ...(replyTo && { reply_to: replyTo }),
        }),
      });

      const responseData = await resendResponse.json();

      if (resendResponse.ok) {
        console.log("✅ Email sent successfully via Resend!");
        console.log("   Response ID:", responseData.id);
        return { success: true };
      } else {
        console.error("❌ Resend API error:", {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          error: responseData
        });
        return { 
          success: false, 
          error: `Resend API error: ${JSON.stringify(responseData)}` 
        };
      }
    } catch (error: any) {
      console.error("❌ Resend API exception:", error.message);
      // Continue to try other methods
    }
  } else {
    console.warn("⚠️  RESEND_API_KEY not configured");
  }

  // If Resend fails or is not configured, try alternative methods
  // For now, we'll just log and return failure
  // In the future, you can add:
  // - EmailJS
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  
  console.warn("⚠️  No email service configured - email not sent");
  console.warn("   To enable email sending, add RESEND_API_KEY to environment variables");
  console.warn("   Email details:", { to, subject });
  
  return { 
    success: false, 
    error: "No email service configured. Please add RESEND_API_KEY to environment variables." 
  };
}
