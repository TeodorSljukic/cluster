"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/lib/getTranslations";
import { defaultLocale, locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

interface CMSLayoutProps {
  children: React.ReactNode;
  locale?: Locale;
}

export function CMSLayout({ children, locale: propLocale }: CMSLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [cmsLocale, setCmsLocale] = useState<Locale>(defaultLocale);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("cms-locale") as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setCmsLocale(savedLocale);
    } else if (propLocale) {
      setCmsLocale(propLocale);
    }
  }, [propLocale]);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cms-locale", cmsLocale);
  }, [cmsLocale]);

  // Fetch current user - cache in sessionStorage to avoid repeated calls
  useEffect(() => {
    async function fetchUser() {
      try {
        // Check cache first
        const cachedUser = sessionStorage.getItem("cms-current-user");
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            const cacheTime = user._cacheTime || 0;
            // Cache for 5 minutes
            if (Date.now() - cacheTime < 5 * 60 * 1000) {
              setCurrentUser(user);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            // Cache user data
            const userWithCache = { ...data.user, _cacheTime: Date.now() };
            sessionStorage.setItem("cms-current-user", JSON.stringify(userWithCache));
            setCurrentUser(data.user);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUser();
  }, []);

  // Check if mobile
  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    }
    // Check immediately
    checkMobile();
    // Also check after a short delay to ensure window is available
    const timeout = setTimeout(checkMobile, 100);
    window.addEventListener("resize", checkMobile);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const t = getTranslations(cmsLocale);

  const menuItems = [
    {
      title: t.cms.dashboard,
      icon: "📊",
      href: "/admin",
      exact: true,
    },
    {
      title: t.cms.posts,
      icon: "📝",
      children: [
        { title: t.cms.news, href: "/admin/posts?type=news" },
        { title: t.cms.events, href: "/admin/posts?type=event" },
      ],
    },
    {
      title: t.cms.users,
      icon: "👥",
      href: "/admin/users",
    },
    {
      title: t.cms.media,
      icon: "🖼️",
      href: "/admin/media",
    },
    {
      title: t.cms.settings,
      icon: "⚙️",
      href: "/admin/settings",
    },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) {
      return pathname === href;
    }
    // Handle query params in href
    const hrefPath = href.split("?")[0];
    return pathname?.startsWith(hrefPath);
  }

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f0f0f1",
        marginTop: "32px", // Admin bar height
        position: "relative",
      }}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            position: "fixed",
            top: "42px",
            left: "10px",
            background: "#2271b1",
            border: "none",
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#135e96";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2271b1";
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: "32px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: isMobile 
            ? (mobileMenuOpen ? "240px" : "240px")
            : (sidebarOpen ? "160px" : "36px"),
          background: "#1d2327",
          color: "#f0f0f1",
          transition: isMobile ? "transform 0.3s ease" : "width 0.2s",
          position: "fixed",
          left: 0,
          top: "32px",
          bottom: 0,
          overflowY: "auto",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: isMobile 
            ? (mobileMenuOpen ? "translateX(0)" : "translateX(-100%)")
            : "translateX(0)",
          boxShadow: isMobile && mobileMenuOpen ? "2px 0 8px rgba(0,0,0,0.3)" : "none",
          visibility: isMobile && !mobileMenuOpen ? "hidden" : "visible",
        }}
      >
        {/* User Avatar Section */}
        {sidebarOpen && currentUser && (
          <div
            style={{
              padding: "15px 12px",
              borderBottom: "1px solid #32373c",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: currentUser.profilePicture
                  ? `url(${currentUser.profilePicture})`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                flexShrink: 0,
                border: "2px solid #72aee6",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {!currentUser.profilePicture && (
                <span>
                  {currentUser.displayName?.[0]?.toUpperCase() ||
                    currentUser.username?.[0]?.toUpperCase() ||
                    "A"}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#f0f0f1",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentUser.displayName || currentUser.username || "Admin"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#b4b9be",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentUser.role === "admin" ? "Administrator" : "User"}
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "10px 0", flex: 1 }}>
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.children ? (
                <div>
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#f0f0f1",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#32373c";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{item.icon}</span>
                    {sidebarOpen && <span>{item.title}</span>}
                  </div>
                  {sidebarOpen && (
                    <div style={{ paddingLeft: "20px" }}>
                      {item.children.map((child, childIndex) => {
                        const childPath = child.href.split("?")[0];
                        const isChildActive = pathname === childPath || 
                          (child.href.includes("?type=") && pathname?.startsWith("/admin/posts"));
                        return (
                          <Link
                            key={childIndex}
                            href={child.href}
                            prefetch={true}
                            style={{
                              display: "block",
                              padding: "6px 12px",
                              fontSize: "15px",
                              color: isChildActive ? "#72aee6" : "#b4b9be",
                              textDecoration: "none",
                              background: isChildActive ? "#32373c" : "transparent",
                              borderLeft: isChildActive
                                ? "4px solid #72aee6"
                                : "4px solid transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.background = "#32373c";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href || "#"}
                  prefetch={true}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "16px",
                    color: isActive(item.href || "", item.exact)
                      ? "#72aee6"
                      : "#b4b9be",
                    textDecoration: "none",
                    background: isActive(item.href || "", item.exact)
                      ? "#32373c"
                      : "transparent",
                    borderLeft: isActive(item.href || "", item.exact)
                      ? "4px solid #72aee6"
                      : "4px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href || "", item.exact)) {
                      e.currentTarget.style.background = "#32373c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href || "", item.exact)) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Language Selector */}
        {sidebarOpen && (
          <div style={{ padding: "10px 12px", borderTop: "1px solid #32373c", marginTop: "10px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#b4b9be", marginBottom: "5px" }}>
              {t.cms.language || "Language"}
            </label>
            <select
              value={cmsLocale}
              onChange={(e) => {
                const newLocale = e.target.value as Locale;
                setCmsLocale(newLocale);
                localStorage.setItem("cms-locale", newLocale);
                // Trigger custom event to notify other components
                window.dispatchEvent(new Event("cms-locale-changed"));
              }}
              style={{
                width: "100%",
                padding: "4px 6px",
                background: "#32373c",
                color: "#f0f0f1",
                border: "1px solid #50575e",
                borderRadius: "3px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeNames[locale]} ({locale.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggle button - only show on desktop */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: "absolute",
              bottom: sidebarOpen ? "60px" : "10px",
              right: sidebarOpen ? "10px" : "6px",
              background: "#2271b1",
              border: "none",
              color: "white",
              width: sidebarOpen ? "28px" : "24px",
              height: sidebarOpen ? "28px" : "24px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#135e96";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2271b1";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={sidebarOpen ? t.cms.collapse || "Collapse" : t.cms.expand || "Expand"}
          >
            {sidebarOpen ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          marginLeft: isMobile 
            ? "0" 
            : (sidebarOpen ? "160px" : "36px"),
          flex: 1,
          transition: "margin-left 0.2s",
          padding: isMobile ? "10px" : "20px",
          width: isMobile ? "100%" : "auto",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}
