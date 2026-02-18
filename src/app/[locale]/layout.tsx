import type { Metadata } from "next";
import { AdminBar } from "@/components/AdminBar";
import { AOSInit } from "@/components/AOSInit";
import { ConditionalHeaderFooter } from "@/components/ConditionalHeaderFooter";
import { ActivityTracker } from "@/components/ActivityTracker";
import { VisitorTracker } from "@/components/VisitorTracker";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Adriatic Blue Growth Cluster",
  description: "Adriatic Blue Growth Cluster (ABGC)",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = (resolvedParams.locale as Locale) || defaultLocale;

  return (
    <>
      <ActivityTracker />
      <VisitorTracker />
      <AdminBar />
      <div id="main-content">
        <ConditionalHeaderFooter>
          {children}
        </ConditionalHeaderFooter>
      </div>

      {/* AOS */}
      <AOSInit />
    </>
  );
}
