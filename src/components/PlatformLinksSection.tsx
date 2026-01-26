"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

interface RegisteredPlatforms {
  lms?: boolean;
  ecommerce?: boolean;
  dms?: boolean;
}

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

  const handlePlatformClick = (platform: "lms" | "ecommerce" | "dms", url: string) => {
    if (!user) {
      // If not logged in, redirect to registration
      router.push(localeLink("/", locale));
      // Scroll to registration form
      setTimeout(() => {
        const form = document.querySelector('[data-register-form]');
        if (form) {
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return;
    }

    // Check if user is registered on this platform
    const registeredPlatforms = user.registeredPlatforms || {
      lms: false,
      ecommerce: false,
      dms: false,
    };

    if (registeredPlatforms[platform]) {
      // User is registered, open platform link
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // User is logged in but not registered on this platform
      // Scroll to top to show message or could redirect to registration
      const platformName = platform === "lms" ? "eLearning" : platform === "ecommerce" ? "eCommerce" : "Documents";
      if (confirm(`Niste registrovan na ${platformName} platformi. Želite li da se registrujete?`)) {
        router.push(localeLink("/", locale));
        setTimeout(() => {
          const form = document.querySelector('[data-register-form]');
          if (form) {
            form.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
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
          {platforms.map((platform, index) => {
            const isRegistered = user?.registeredPlatforms?.[platform.id as keyof RegisteredPlatforms];
            const canClick = user && isRegistered;

            return (
              <div
                key={platform.id}
                className="platform-item"
                data-aos="zoom-in"
                data-aos-delay={(index + 1) * 100}
                onClick={() => handlePlatformClick(platform.id as "lms" | "ecommerce" | "dms", platform.url)}
                style={{
                  cursor: canClick ? "pointer" : user ? "not-allowed" : "pointer",
                  opacity: user && !isRegistered ? 0.6 : 1,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (canClick || !user) {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <img src={platform.image} alt={platform.label} />
                <h3>{platform.label}</h3>
                {user && !isRegistered && (
                  <span style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "8px",
                    display: "block",
                  }}>
                    Nije registrovan
                  </span>
                )}
                {!user && (
                  <span style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "8px",
                    display: "block",
                  }}>
                    Registrujte se
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
