import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "hub:theme";
const listeners = new Set<(t: Theme) => void>();
let current: Theme = "light";

function apply(theme: Theme) {
  current = theme;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
  listeners.forEach((l) => l(theme));
}

function read(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, theme);
  apply(theme);
}

/** Theme state synced across every component and persisted to localStorage. */
export function useTheme() {
  const [theme, setLocal] = useState<Theme>(current);

  useEffect(() => {
    const initial = read();
    apply(initial);
    const listener = (t: Theme) => setLocal(t);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    theme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    setTheme,
  };
}
