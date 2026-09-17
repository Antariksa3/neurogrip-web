import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "neurogrip_text_scale";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "large" ? "large" : "normal";
  } catch {
    return "normal";
  }
}

export function useTextScale() {
  const [scale, setScale] = useState(readStored);

  useEffect(() => {
    document.documentElement.dataset.textScale = scale;
    try {
      localStorage.setItem(STORAGE_KEY, scale);
    } catch {}
  }, [scale]);

  const toggle = useCallback(() => {
    setScale((s) => (s === "large" ? "normal" : "large"));
  }, []);

  return { scale, isLarge: scale === "large", toggle };
}
