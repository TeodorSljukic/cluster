"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { localeLink, type Locale } from "@/lib/localeLink";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
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
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user || data.user.role !== "admin") {
        router.push(localeLink("/login", locale));
        return;
      }
      setUser(data.user);
    } catch (error) {
      router.push(localeLink("/login", locale));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
