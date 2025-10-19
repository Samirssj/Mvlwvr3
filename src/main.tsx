import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./analytics";
import "./index.css";
import { applySeasonTheme, getSeasonTheme } from "./lib/theme";
import { supabase } from "@/integrations/supabase/client";

initAnalytics();
// Apply saved seasonal theme (default/halloween/christmas/newyear)
try {
  const saved = getSeasonTheme();
  applySeasonTheme(saved);
} catch {}

// Try to load global theme from Supabase and subscribe to changes for multi-device sync
(async () => {
  try {
    const sb: any = supabase as any;
    const { data, error } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", "season_theme")
      .single();
    if (!error && data?.value) {
      applySeasonTheme(data.value as any);
    }
  } catch {}

  try {
    (supabase as any)
      .channel("app_settings_theme")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.season_theme" },
        (payload: any) => {
          const theme = payload?.new?.value || payload?.old?.value;
          if (theme) applySeasonTheme(theme as any);
        }
      )
      .subscribe();
  } catch {}
})();
createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {/* noop */});
  });
}
