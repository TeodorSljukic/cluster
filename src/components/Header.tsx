"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Menu, X } from "lucide-react";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";
import { getTranslations } from "@/lib/getTranslations";
import { localeLink } from "@/lib/localeLink";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Extract locale from pathname
  const currentLocale: Locale = (() => {
    const match = pathname?.match(/^\/([^\/]+)/);
    if (match && locales.includes(match[1] as Locale)) {
      return match[1] as Locale;
    }
    return "me";
  })();

  const t = getTranslations(currentLocale);

  useEffect(() => {
    checkAuth();
  }, [pathname]); // Refresh when route changes (e.g., after login/logout)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close lang menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showLangMenu && langMenuRef.current && !langMenuRef.current.contains(target)) {
        setShowLangMenu(false);
      }
    }

    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showLangMenu]);

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
    <header className="site-header">
      <div className="container header-inner">
        {/* Logo */}
        <div className="site-branding">
          <Link href={localeLink("/", currentLocale)} className="site-title">
            <img 
              src="/wp-content/uploads/2025/09/cropped-Frame-1000002133.webp" 
              alt="Adriatic Blue Growth Cluster"
              style={{ height: "60px", width: "auto", objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Hamburger dugme */}
        <button
          className="hamburger"
          aria-label="Open menu"
          aria-controls="site-menu"
          aria-expanded={mobileMenuOpen}
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop navigacija */}
        <nav className="main-nav" aria-label="Main Menu" id="site-menu">
          <ul className="nav-menu">
            <li>
              <Link href={`/${currentLocale}`}>{t.common.home}</Link>
            </li>
            <li>
              <Link href={`/${currentLocale}/about`}>{t.common.about}</Link>
            </li>
            <li>
              <Link href={`/${currentLocale}/news`}>{t.common.news}</Link>
            </li>
            {user && (
              <>
                <li>
                  <Link href={`/${currentLocale}/dashboard`}>{t.common.dashboard}</Link>
                </li>
                <li>
                  <Link href={`/${currentLocale}/chat`}>{t.chat.title}</Link>
                </li>
              </>
            )}
            <li>
              <Link href={`/${currentLocale}/contact`}>{t.common.contact}</Link>
            </li>
          </ul>
        </nav>

        {/* Extra buttons (desktop) */}
        <div className="header-actions">
          {user && (
            <Link 
              href={localeLink("/search", currentLocale)}
              className="search-btn"
              style={{ 
                cursor: "pointer", 
                border: "inherit", 
                background: "inherit", 
                padding: "inherit", 
                width: "inherit", 
                height: "inherit",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "space-between",
                textDecoration: "none",
              }}
            >
              <Search size={20} className="search-icon" />
              <span>Search</span>
            </Link>
          )}

          {/* Language switcher */}
          <div className="lang-switcher" ref={langMenuRef}>
            <button 
              className="lang-btn" 
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
            >
              <span className="lang-current">
                <img 
                  src={localeFlags[currentLocale]} 
                  alt={localeNames[currentLocale]}
                  className="flag-icon"
                />
                <span>{currentLocale.toUpperCase()}</span>
              </span>
            </button>
            <ul 
              className={`lang-dropdown ${showLangMenu ? "show" : ""}`}
            >
              {locales.map((locale) => {
                const newPath = pathname?.replace(/^\/[^\/]+/, `/${locale}`) || `/${locale}`;
                return (
                  <li key={locale}>
                    <Link
                      href={newPath}
                      onClick={() => setShowLangMenu(false)}
                      className={locale === currentLocale ? "active" : ""}
                    >
                      <img 
                        src={localeFlags[locale]} 
                        alt={localeNames[locale]}
                        className="flag-icon"
                      />
                      <span>{localeNames[locale]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Register / Profile button */}
          {!loading && (
            user ? (
              <Link href={`/${currentLocale}/profile`} className="btn-register">
                <User size={20} className="register-icon" />
                <span>{user.displayName || user.username || t.common.profile}</span>
              </Link>
            ) : (
              <Link href={`/${currentLocale}/login`} className="btn-register">
                <User size={20} className="register-icon" />
                <span>{t.common.login}</span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobilni overlay meni */}
      <div 
        className={`mobile-overlay-menu ${mobileMenuOpen ? "active" : ""}`} 
        id="mobileMenu"
      >
        <div className="mobile-overlay-header">
          <div className="mobile-overlay-logo">
            <img 
              src="/wp-content/uploads/2025/09/cropped-Frame-1000002133.webp" 
              alt="Adriatic Blue Growth Cluster"
              style={{ height: "50px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <button 
            className="close-mobile" 
            aria-label="Close menu" 
            type="button"
            onClick={() => setMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>

        <nav className="mobile-overlay-nav">
          <ul className="mobile-menu-list">
            <li>
              <Link 
                href={`/${currentLocale}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.home}
              </Link>
            </li>
            <li>
              <Link 
                href={`/${currentLocale}/about`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.about}
              </Link>
            </li>
            <li>
              <Link 
                href={`/${currentLocale}/news`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.news}
              </Link>
            </li>
            {user && (
              <>
                <li>
                  <Link 
                    href={`/${currentLocale}/dashboard`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.common.dashboard}
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/${currentLocale}/chat`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.chat.title}
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link 
                href={`/${currentLocale}/contact`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.contact}
              </Link>
            </li>
          </ul>

          {/* Extra actions (mobile) */}
          <div className="mobile-actions">
            {user && (
              <Link 
                href={localeLink("/search", currentLocale)}
                className="search-btn"
                style={{ cursor: "pointer", width: "100%", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Search size={20} className="search-icon" />
                <span>Search</span>
              </Link>
            )}

            <div className="lang-switcher">
              <button 
                className="lang-btn" 
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                <span className="lang-current">
                  <img 
                    src={localeFlags[currentLocale]} 
                    alt={localeNames[currentLocale]}
                    className="flag-icon"
                  />
                  <span>{localeNames[currentLocale]}</span>
                </span>
              </button>
              <ul 
                className={`lang-dropdown ${showLangMenu ? "show" : ""}`}
              >
                {locales.map((locale) => {
                  const newPath = pathname?.replace(/^\/[^\/]+/, `/${locale}`) || `/${locale}`;
                  return (
                    <li key={locale}>
                      <Link
                        href={newPath}
                        onClick={() => setShowLangMenu(false)}
                        className={locale === currentLocale ? "active" : ""}
                      >
                        <img 
                          src={localeFlags[locale]} 
                          alt={localeNames[locale]}
                          className="flag-icon"
                        />
                        <span>{localeNames[locale]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {!loading && (
              user ? (
                <Link href={`/${currentLocale}/profile`} className="btn-register">
                  <User size={20} className="register-icon" />
                  <span>{user.displayName || user.username || t.common.profile}</span>
                </Link>
              ) : (
                <Link href={`/${currentLocale}/login`} className="btn-register">
                  <User size={20} className="register-icon" />
                  <span>{t.common.login}</span>
                </Link>
              )
            )}
          </div>
        </nav>
      </div>

    </header>
  );
}

