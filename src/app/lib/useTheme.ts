// lib/useTheme.ts
export type Theme = "light" | "dark";

const THEME_KEY = "theme";

/**
 * Apply theme to <html data-theme="..."> and persist.
 */
export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Get current theme from DOM (source of truth after init).
 */
export function getTheme(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return (t === "dark" ? "dark" : "light") satisfies Theme;
}

/**
 * Initialize theme on the client:
 * - localStorage preference, else
 * - system preference
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") {
    setTheme(saved);
    return;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  setTheme(prefersDark ? "dark" : "light");
}

/**
 * Small helper to toggle.
 */
export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

/**
 * Inline script content (for Next.js <head>) to prevent flash.
 * Use as <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
 */
export const themeInitScript = `
(() => {
  try {
    const key = "${THEME_KEY}";
    const saved = localStorage.getItem(key);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = (saved === "light" || saved === "dark") ? saved : (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;
