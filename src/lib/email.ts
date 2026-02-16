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
  const toArray = Array.isArray(to) ? to : [to];
  
  console.log("📧 Attempting to send email...");
  console.log("   To:", toArray.join(", "));
  console.log("   Subject:", subject);
  
  // Try EmailJS first (simplest, no domain verification needed)
  const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
  const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
  const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  
  if (emailjsPublicKey && emailjsServiceId && emailjsTemplateId) {
    try {
      console.log("   Trying EmailJS...");
      // Convert HTML to plain text for EmailJS
      const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      
      const emailjsResponse = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          template_params: {
            to_email: toArray[0],
            to_name: toArray[0].split('@')[0],
            subject: subject,
            message_html: html,
            message_text: plainText,
            reply_to: replyTo || from,
          },
        }),
      });

      if (emailjsResponse.ok) {
        console.log("✅ Email sent successfully via EmailJS!");
        return { success: true };
      } else {
        const errorText = await emailjsResponse.text();
        console.error("❌ EmailJS error:", errorText);
      }
    } catch (error: any) {
      console.error("❌ EmailJS exception:", error.message);
    }
  }
  
  // Try simple webhook approach (if configured)
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      console.log("   Trying webhook...");
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toArray,
          subject,
          html,
          from,
          replyTo,
        }),
      });

      if (webhookResponse.ok) {
        console.log("✅ Email sent successfully via webhook!");
        return { success: true };
      }
    } catch (error: any) {
      console.error("❌ Webhook exception:", error.message);
    }
  }
  
  // Try Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    try {
      console.log("   Trying Resend API...");
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: toArray,
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
      }
    } catch (error: any) {
      console.error("❌ Resend API exception:", error.message);
    }
  }
  
  // Fallback: Try using a simple webhook or mailto (not recommended for production)
  console.warn("⚠️  No email service configured");
  console.warn("   Configure one of the following:");
  console.warn("   - EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID (easiest)");
  console.warn("   - RESEND_API_KEY");
  console.warn("   Email details:", { to: toArray, subject });
  
  return { 
    success: false, 
    error: "No email service configured. Please add EMAILJS_* or RESEND_API_KEY to environment variables." 
  };
}
