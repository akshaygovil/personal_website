// components/ThemeToggle.tsx
"use client";

import * as React from "react";
import { getTheme, toggleTheme } from "../lib/useTheme";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setThemeState] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    setMounted(true);
    setThemeState(getTheme());

    const obs = new MutationObserver(() => setThemeState(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // Avoid hydration mismatch flicker on first paint
  if (!mounted) return <button className="btn iconBtn" aria-label="Toggle theme" />;

  const isDark = theme === "dark";

  return (
    <button
      className="btn iconBtn"
      onClick={() => toggleTheme()}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
