"use client";

import { useEffect } from "react";

export function ActivityTracker() {
  useEffect(() => {
    // Update activity on mount
    fetch("/api/users/activity", { method: "POST" }).catch(console.error);

    // Update activity every 2 minutes
    const interval = setInterval(async () => {
      try {
        await fetch("/api/users/activity", { method: "POST" });
      } catch (error) {
        console.error("Error updating activity:", error);
      }
    }, 120000); // 2 minutes

    // Update activity on user interaction
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      fetch("/api/users/activity", { method: "POST" }).catch(console.error);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
