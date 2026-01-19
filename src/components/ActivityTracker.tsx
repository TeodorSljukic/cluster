"use client";

import { useEffect, useRef } from "react";

export function ActivityTracker() {
  const lastActivityRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update activity on mount (only once)
    const updateActivity = async () => {
      const now = Date.now();
      // Only update if last update was more than 30 seconds ago
      if (now - lastActivityRef.current > 30000) {
        try {
          await fetch("/api/users/activity", { method: "POST" });
          lastActivityRef.current = now;
        } catch (error) {
          console.error("Error updating activity:", error);
        }
      }
    };

    // Initial update
    updateActivity();

    // Update activity every 2 minutes (not on every interaction)
    const interval = setInterval(updateActivity, 120000); // 2 minutes

    // Debounced activity update on user interaction (max once per 30 seconds)
    const events = ["mousedown", "keydown"];
    const handleActivity = () => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout (debounce for 30 seconds)
      debounceTimeoutRef.current = setTimeout(() => {
        updateActivity();
      }, 30000);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
