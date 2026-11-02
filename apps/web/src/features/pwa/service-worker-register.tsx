"use client";

import { useEffect, useState } from "react";
import { OfflineStatusPill } from "@moonwitness/ui";

export function ServiceWorkerRegister() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silently continue if SW registration fails
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block">
      <OfflineStatusPill isOnline={isOnline} cachedSurahCount={114} totalSurahCount={114} />
    </div>
  );
}
