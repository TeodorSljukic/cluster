import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Adriatic Blue Growth Cluster",
  description: "Adriatic Blue Growth Cluster (ABGC)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Middleware will handle redirects to /[locale] before this layout is called
  // [locale]/layout.tsx will provide the actual content structure
  return (
    <html lang="me">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/admin-responsive.css" />
        <link rel="stylesheet" href="/assets/css/admin-bar.css" />
        <link rel="stylesheet" href="/assets/css/pages/chat-responsive.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
        />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        {/* Swiper custom elements (used by <swiper-container/>) */}
        <Script
          src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-element-bundle.min.js"
          strategy="afterInteractive"
        />
        {/* Theme JS (accordion + mobile menu) */}
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
