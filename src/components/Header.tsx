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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Live search functionality
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search dropdown and lang menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showSearch && !target.closest('[data-search-container]')) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (showLangMenu && langMenuRef.current && !langMenuRef.current.contains(target)) {
        setShowLangMenu(false);
      }
    }

    if (showSearch || showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearch, showLangMenu]);

  async function searchUsers(query: string) {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  }

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
            <li>
              <Link href={`/${currentLocale}/resources`}>{t.common.resources}</Link>
            </li>
            <li>
              <Link href={`/${currentLocale}/skills`}>{t.common.skills}</Link>
            </li>
            <li>
              <Link href={`/${currentLocale}/dashboard`}>{t.common.dashboard}</Link>
            </li>
            <li>
              <Link href={`/${currentLocale}/contact`}>{t.common.contact}</Link>
            </li>
          </ul>
        </nav>

        {/* Extra buttons (desktop) */}
        <div className="header-actions" data-search-container>
          <div style={{ position: "relative" }}>
            <button 
              className="search-btn" 
              onClick={() => {
                setShowSearch(!showSearch);
                if (!showSearch && searchInputRef.current) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
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
              }}
            >
              <Search size={20} className="search-icon" />
              <span>Search</span>
            </button>
            
            {/* Search Dropdown */}
            {showSearch && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "white",
                  borderRadius: "8px",
                  width: "400px",
                  maxHeight: "500px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 1000,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Search size={18} color="#666" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      padding: "4px 0",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={16} color="#666" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: "400px",
                    padding: "8px",
                  }}
                >
                  {searchLoading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                      Searching...
                    </div>
                  ) : searchQuery.trim().length < 2 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                      Type at least 2 characters to search
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                      No users found
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {searchResults.map((user) => (
                        <Link
                          key={user._id}
                          href={localeLink(`/user-profile?id=${user._id}`, currentLocale)}
                          onClick={() => {
                            setShowSearch(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px",
                            borderRadius: "6px",
                            textDecoration: "none",
                            color: "inherit",
                            transition: "background 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f5f5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: user.profilePicture
                                ? `url(${user.profilePicture}) center/cover`
                                : "#e4e4e4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "16px",
                              color: "#666",
                              flexShrink: 0,
                            }}
                          >
                            {!user.profilePicture &&
                              (user.displayName || user.username)?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                              {user.displayName || user.username}
                            </div>
                            {user.headline && (
                              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.headline}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
                <span>{t.common.profile}</span>
              </Link>
            ) : (
              <Link href={`/${currentLocale}/login`} className="btn-register">
                <User size={20} className="register-icon" />
                <span>{t.common.register}</span>
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
            <li>
              <Link 
                href={`/${currentLocale}/resources`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.resources}
              </Link>
            </li>
            <li>
              <Link 
                href={`/${currentLocale}/skills`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.skills}
              </Link>
            </li>
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
                href={`/${currentLocale}/contact`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.common.contact}
              </Link>
            </li>
          </ul>

          {/* Extra actions (mobile) */}
          <div className="mobile-actions">
            <button 
              className="search-btn" 
              onClick={() => setShowSearch(true)}
              style={{ cursor: "pointer", width: "100%" }}
            >
              <Search size={20} className="search-icon" />
              <span>Search</span>
            </button>

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
                  <span>{t.common.profile}</span>
                </Link>
              ) : (
                <Link href={`/${currentLocale}/login`} className="btn-register">
                  <User size={20} className="register-icon" />
                  <span>{t.common.register}</span>
                </Link>
              )
            )}
          </div>
        </nav>
      </div>

    </header>
  );
}

