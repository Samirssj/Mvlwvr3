import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/analytics";

type PlayerProps = {
  embedUrl: string;
  contentId: string;
  episodeId?: string;
};

export default function Player({ embedUrl, contentId, episodeId }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Obtener usuario para poder guardar progreso
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Analytics: register content play/view when component mounts or ids change
  useEffect(() => {
    if (!contentId) return;
    trackEvent("content_play", { content_id: contentId, episode_id: episodeId || null });
  }, [contentId, episodeId]);

  const goFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    // Nota: No todos los navegadores soportan los prefijos antiguos
  };

  const saveProgress = async (seconds: number) => {
    if (!userId) return;
    // Debido a CORS de los iframes externos, no podemos leer el tiempo real.
    // Guardamos un placeholder (0) y dejamos lista la estructura.
    // Cuando usemos un proveedor con API (p.ej. postMessage), actualizaremos.
    try {
      await supabase.from("watch_progress").upsert(
        {
          user_id: userId,
          content_id: contentId,
          episode_id: episodeId ?? null,
          progress_seconds: Math.max(0, Math.floor(seconds)),
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id,episode_id" }
      );
    } catch {
      // Silencioso
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Placeholder: 0s (sin acceso a tiempo real del iframe externo)
      saveProgress(0);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveProgress(0);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, contentId, episodeId]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          loading="lazy"
          title="Player"
        />
      </div>

    </div>
  );
}