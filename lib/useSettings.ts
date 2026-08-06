"use client";

import { useEffect, useState } from "react";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/settings?t=${Date.now()}`;
    fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
