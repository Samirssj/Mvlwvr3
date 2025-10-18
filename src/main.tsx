import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./analytics";
import "./index.css";

initAnalytics();
createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {/* noop */});
  });
}
