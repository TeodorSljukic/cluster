"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Track page visit
    const trackVisit = async () => {
      // Only track once per page load
      if (trackedRef.current.has(pathname)) {
        return;
      }

      try {
        await fetch("/api/visitors/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pathname,
            referrer: document.referrer || "",
          }),
        });
        trackedRef.current.add(pathname);
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error("Error tracking visitor:", error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(trackVisit, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
