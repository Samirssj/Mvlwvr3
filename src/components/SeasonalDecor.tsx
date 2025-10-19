import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSeasonTheme, type SeasonTheme } from "@/lib/theme";

function useSeason(): SeasonTheme {
  const [t, setT] = useState<SeasonTheme>(() => getSeasonTheme());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { theme?: SeasonTheme } | undefined;
      if (detail?.theme) setT(detail.theme);
      else setT(getSeasonTheme());
    };
    window.addEventListener("season-theme-changed", onChange as any);
    return () => window.removeEventListener("season-theme-changed", onChange as any);
  }, []);
  return t;
}

function randomItems(count: number, seed: number) {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    left: Math.round(rand() * 100),
    size: 16 + Math.round(rand() * 20),
    delay: +(rand() * 5).toFixed(2),
    duration: 6 + Math.round(rand() * 8),
  }));
}

export function SeasonalDecor() {
  const theme = useSeason();
  const { pathname } = useLocation();
  const bats = useMemo(() => randomItems(10, 13), []);
  const snow = useMemo(() => randomItems(24, 37), []);
  const confetti = useMemo(() => randomItems(30, 71), []);

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  // Only render on home page
  if (pathname !== "/") return null;

  return (
    <div className="pointer-events-none fixed z-30 overflow-hidden" style={{ top: 0, left: 0, width: "100vw", height: "50vh" }}>
      {theme === "halloween" && (
        <div className="absolute inset-0">
          {bats.map((b) => (
            <div
              key={`bat-${b.key}`}
              className="absolute select-none float-anim"
              style={{ left: `${b.left}%`, top: `-${b.size}px`, animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s` }}
            >
              <span style={{ fontSize: `${b.size}px` }} role="img" aria-label="bat">🦇</span>
            </div>
          ))}
        </div>
      )}

      {theme === "christmas" && (
        <div className="absolute inset-0">
          {snow.map((s) => (
            <div
              key={`snow-${s.key}`}
              className="absolute select-none snow-anim"
              style={{ left: `${s.left}%`, top: `-${s.size}px`, animationDelay: `${s.delay}s`, animationDuration: `${6 + s.duration}s` }}
            >
              <span style={{ fontSize: `${s.size}px`, color: "#fff" }} role="img" aria-label="snow">❄️</span>
            </div>
          ))}
        </div>
      )}

      {theme === "newyear" && (
        <div className="absolute inset-0">
          {confetti.map((c) => (
            <div
              key={`conf-${c.key}`}
              className="absolute select-none confetti-anim"
              style={{ left: `${c.left}%`, top: `-${c.size}px`, animationDelay: `${c.delay}s`, animationDuration: `${5 + c.duration}s` }}
            >
              <span style={{ fontSize: `${c.size}px` }} role="img" aria-label="sparkles">✨</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SeasonalDecor;
