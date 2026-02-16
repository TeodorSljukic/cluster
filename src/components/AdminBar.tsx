"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { localeLink, type Locale } from "@/lib/localeLink";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string;
}

export function AdminBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true); // Reset loading state when route changes
    checkAuth();
  }, [pathname]); // Re-check when route changes (e.g., after login)

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user && data.user.role === "admin") {
        setUser(data.user);
      } else {
        setUser(null); // Clear user if not admin
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Clear all caches
      sessionStorage.removeItem("header-current-user");
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear user state
      setUser(null);
      
      // Dispatch logout event for other components
      window.dispatchEvent(new Event("user-logged-out"));
      
      // Extract locale from pathname
      const locale: Locale = (() => {
        const match = pathname?.match(/^\/([^\/]+)/);
        if (match && ["me", "en", "it", "sq"].includes(match[1])) {
          return match[1] as Locale;
        }
        return "me";
      })();
      
      // Force page reload to clear all state
      window.location.href = localeLink("/login", locale);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  if (loading || !user) {
    return null;
  }

  // Don't show admin bar on login page
  if (pathname === "/login") {
    return null;
  }

  const isOnSite = !pathname?.startsWith("/admin") && pathname !== "/dashboard";

  return (
    <div
      data-admin-bar="true"
      className="admin-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "32px",
        background: "#23282d",
        color: "#a0a5aa",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        zIndex: 9999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      <div className="admin-bar-left" style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1, minWidth: 0 }}>
        {/* Site Logo/Name */}
        <Link
          href="/"
          style={{
            color: "#a0a5aa",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: "600",
            marginRight: "10px",
          }}
          className="admin-bar-logo"
        >
          <span className="admin-bar-emoji" style={{ fontSize: "16px" }}>🌊</span>
          <span className="admin-bar-logo-text">ABGC</span>
        </Link>

        {/* Main Navigation */}
        <div className="admin-bar-nav" style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #3c434a", paddingLeft: "15px" }}>
          {isOnSite ? (
            <Link
              href="/admin"
              style={{
                color: "#a0a5aa",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 8px",
                borderRadius: "3px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#32373c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="admin-bar-icon" style={{ fontSize: "14px" }}>⚙️</span>
              <span>CMS</span>
            </Link>
          ) : (
            <Link
              href="/"
              style={{
                color: "#a0a5aa",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 8px",
                borderRadius: "3px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#32373c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="admin-bar-icon" style={{ fontSize: "14px" }}>🏠</span>
              <span>Visit Site</span>
            </Link>
          )}
        </div>
      </div>

      {/* Right side - User info */}
      <div className="admin-bar-right" style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #3c434a", paddingLeft: "15px", flexShrink: 0 }}>
        <span className="admin-bar-greeting" style={{ fontSize: "13px" }}>Howdy, {user.displayName || user.username}</span>
        <div
          className="admin-bar-avatar"
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            background: "#50575e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#5c636a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#50575e";
          }}
          title={user.email}
        >
          {(user.displayName || user.username).charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "none",
            color: "#a0a5aa",
            cursor: "pointer",
            fontSize: "13px",
            padding: "2px 8px",
            borderRadius: "3px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#32373c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
