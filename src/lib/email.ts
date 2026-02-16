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
  
  // Convert HTML to plain text
  const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  
  // Try Formspree (no configuration needed, just endpoint)
  const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
  if (formspreeEndpoint) {
    try {
      console.log("   Trying Formspree...");
      const formspreeResponse = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _to: toArray[0],
          _subject: subject,
          _replyto: replyTo || toArray[0],
          message: plainText,
          html: html,
        }),
      });

      if (formspreeResponse.ok) {
        console.log("✅ Email sent successfully via Formspree!");
        return { success: true };
      }
    } catch (error: any) {
      console.error("❌ Formspree exception:", error.message);
    }
  }
  
  // Try EmailJS (if configured)
  const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
  const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
  const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  
  if (emailjsPublicKey && emailjsServiceId && emailjsTemplateId) {
    try {
      console.log("   Trying EmailJS...");
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
  
  // Try webhook (if configured)
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
  
  // If nothing works, at least save to database
  console.warn("⚠️  No email service configured - saving to database only");
  console.warn("   To enable email sending, configure one of:");
  console.warn("   - FORMSPREE_ENDPOINT (easiest: https://formspree.io - just get endpoint URL)");
  console.warn("   - EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID");
  console.warn("   - RESEND_API_KEY");
  console.warn("   Email details:", { to: toArray, subject });
  
  return { 
    success: false, 
    error: "No email service configured. Emails are saved to database only." 
  };
}
