"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

interface PlatformLinksSectionProps {
  locale: Locale;
}

export function PlatformLinksSection({ locale }: PlatformLinksSectionProps) {
  const t = getTranslations(locale);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  }

  const handlePlatformClick = (url: string) => {
    // Simply open the platform link in a new tab
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const platforms = [
    {
      id: "dms",
      label: t.platform.documents,
      image: "/wp-content/uploads/2025/09/Frame-10000022262.webp",
      url: "https://info.southadriaticskills.org",
    },
    {
      id: "lms",
      label: t.platform.elearning,
      image: "/wp-content/uploads/2025/09/Frame-1000002235.webp",
      url: "http://edu.southadriaticskills.org",
    },
    {
      id: "ecommerce",
      label: t.platform.ecommerce,
      image: "/wp-content/uploads/2025/09/Frame-1000002234.webp",
      url: "https://market.southadriaticskills.org",
    },
  ];

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <section className="platform">
      <div className="container">
        <h2 className="platform-title" data-aos="fade-up">
          {t.platform.title}
        </h2>

        <div className="platform-grid">
          {platforms.map((platform, index) => (
            <div
              key={platform.id}
              className="platform-item"
              data-aos="zoom-in"
              data-aos-delay={(index + 1) * 100}
              onClick={() => handlePlatformClick(platform.url)}
            >
              <img src={platform.image} alt={platform.label} />
              <h3>{platform.label}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
