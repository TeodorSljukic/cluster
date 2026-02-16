import { NextResponse } from "next/server";

/**
 * Test endpoint to check email service configuration
 * This helps debug which email services are configured
 */
export async function GET() {
  const config = {
    formspree: {
      configured: !!process.env.FORMSPREE_ENDPOINT,
      endpoint: process.env.FORMSPREE_ENDPOINT ? "✅ Set" : "❌ Not set",
    },
    emailjs: {
      configured: !!(
        process.env.EMAILJS_PUBLIC_KEY &&
        process.env.EMAILJS_SERVICE_ID &&
        process.env.EMAILJS_TEMPLATE_ID
      ),
      publicKey: process.env.EMAILJS_PUBLIC_KEY ? "✅ Set" : "❌ Not set",
      serviceId: process.env.EMAILJS_SERVICE_ID ? "✅ Set" : "❌ Not set",
      templateId: process.env.EMAILJS_TEMPLATE_ID ? "✅ Set" : "❌ Not set",
    },
    resend: {
      configured: !!process.env.RESEND_API_KEY,
      apiKey: process.env.RESEND_API_KEY ? "✅ Set" : "❌ Not set",
    },
    webhook: {
      configured: !!process.env.EMAIL_WEBHOOK_URL,
      url: process.env.EMAIL_WEBHOOK_URL ? "✅ Set" : "❌ Not set",
    },
  };

  const hasAnyService = 
    config.formspree.configured ||
    config.emailjs.configured ||
    config.resend.configured ||
    config.webhook.configured;

  return NextResponse.json({
    status: hasAnyService ? "✅ Email service configured" : "❌ No email service configured",
    services: config,
    instructions: {
      formspree: "Get endpoint from https://formspree.io - just create a form and use the endpoint URL",
      emailjs: "Get credentials from https://www.emailjs.com - you need Public Key, Service ID, and Template ID",
      resend: "Get API key from https://resend.com - create account and get API key",
      webhook: "Set EMAIL_WEBHOOK_URL to your custom webhook endpoint",
    },
  });
}
