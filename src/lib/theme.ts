export type SeasonTheme = "default" | "halloween" | "christmas" | "newyear";

const THEME_KEY = "seasonTheme";

export function getSeasonTheme(): SeasonTheme {
  const t = localStorage.getItem(THEME_KEY) as SeasonTheme | null;
  if (!t) return "default";
  if (t === "halloween" || t === "christmas" || t === "newyear") return t;
  return "default";
}

export function applySeasonTheme(theme: SeasonTheme) {
  const root = document.documentElement;
  const body = document.body;

  // Remove all theme classes
  root.classList.remove("theme-halloween", "theme-christmas", "theme-newyear");
  body.classList.remove("bg-halloween", "bg-christmas", "bg-newyear");

  // Apply selected
  switch (theme) {
    case "halloween":
      root.classList.add("theme-halloween");
      body.classList.add("bg-halloween");
      break;
    case "christmas":
      root.classList.add("theme-christmas");
      body.classList.add("bg-christmas");
      break;
    case "newyear":
      root.classList.add("theme-newyear");
      body.classList.add("bg-newyear");
      break;
    default:
      // default theme uses base variables, no extra classes
      break;
  }

  localStorage.setItem(THEME_KEY, theme);
  try {
    window.dispatchEvent(new CustomEvent("season-theme-changed", { detail: { theme } }));
  } catch {}
}
