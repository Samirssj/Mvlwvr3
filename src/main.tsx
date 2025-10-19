import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./analytics";
import "./index.css";
import { applySeasonTheme, getSeasonTheme } from "./lib/theme";

initAnalytics();
// Apply saved seasonal theme (default/halloween/christmas/newyear)
try {
  const saved = getSeasonTheme();
  applySeasonTheme(saved);
} catch {}
createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {/* noop */});
  });
}
