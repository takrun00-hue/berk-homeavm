"use client";

import { useEffect, useState } from "react";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
