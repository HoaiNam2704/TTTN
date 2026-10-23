"use client";

import { useEffect, useState } from "react";

/** Debounce any value; default 300ms for text search fields. Empty value flushes immediately. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const isEmpty =
      value === "" || value === null || value === undefined;
    const ms = isEmpty ? 0 : delayMs;
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
