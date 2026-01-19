"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { localeLink, type Locale } from "@/lib/localeLink";

export function Footer() {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract locale from pathname
  const locale: Locale = (() => {
    const match = pathname?.match(/^\/([^\/]+)/);
    if (match && ["me", "en", "it", "sq"].includes(match[1])) {
      return match[1] as Locale;
    }
    return "me";
  })();

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <footer className="site-footer">
        <div className="footer-top container">
          <div className="footer-left">
            {/* If you copy WP logo into /public/wp-content/uploads/... you can swap this to <img /> */}
            <Link href={localeLink("/", locale)} className="site-title">
              ABGC
            </Link>
          </div>

          <div className="footer-right">
            <nav className="footer-nav">
              <ul>
                <li>
                  <Link href={localeLink("/contact", locale)}>Contact</Link>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} Adriatic Blue Growth Cluster</p>
        </div>
      </footer>

      {/* Floating Chat Button - Only show when user is logged in */}
      {!loading && user && (
        <div id="chat-widget">
          <Link href={localeLink("/chat", locale)} title="Chat">
            <MessageCircle size={28} />
          </Link>
        </div>
      )}
    </>
  );
}

