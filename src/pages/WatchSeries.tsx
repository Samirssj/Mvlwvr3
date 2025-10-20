import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import Player from "@/components/Player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Episode = {
  id: string;
  content_id: string;
  episode_number: number;
  season_number: number;
  title: string | null;
  embed_url: string;
  thumbnail_url?: string | null;
  still_url?: string | null;
  preview_url?: string | null;
  created_at?: string | null;
};

type Content = {
  id: string;
  title: string;
};

export default function WatchSeries() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [current, setCurrent] = useState<Episode | null>(null);

  const buildPreviewSrc = (raw: string): string => {
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if (host.includes("youtube.com") || host.includes("youtu.be")) {
        // Normalizar a /embed/ y forzar autoplay mute
        let id = "";
        if (host.includes("youtu.be")) id = u.pathname.replace("/", "");
        if (host.includes("watch")) id = u.searchParams.get("v") || "";
        if (!id && u.pathname.includes("/embed/")) id = u.pathname.split("/embed/")[1] || "";
        const params = new URLSearchParams({ autoplay: "1", mute: "1", controls: "0", playsinline: "1" });
        return `https://www.youtube.com/embed/${id}?${params.toString()}`;
      }
      if (host.includes("vimeo.com")) {
        const idMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        const id = idMatch?.[1] || "";
        const params = new URLSearchParams({ autoplay: "1", muted: "1", title: "0", byline: "0", portrait: "0" });
        return `https://player.vimeo.com/video/${id}?${params.toString()}`;
      }
      // genérico: intentar añadir autoplay/mute si no existen
      const params = u.searchParams;
      if (!params.has("autoplay")) params.set("autoplay", "1");
      if (!params.has("mute")) params.set("mute", "1");
      u.search = params.toString();
      return u.toString();
    } catch {
      return raw;
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: contentData, error: cErr } = await supabase
          .from("content")
          .select("id,title")
          .eq("id", id)
          .eq("content_type", "series")
          .single();
        if (cErr) throw cErr;

        const { data: epsData, error: eErr } = await supabase
          .from("episodes")
          .select("*")
          .eq("content_id", id)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true });
        if (eErr) throw eErr;

        const eps = (epsData as Episode[]) || [];
        setContent(contentData as Content);
        setEpisodes(eps);

        const epParam = params.get("ep");
        const found = epParam ? eps.find(e => e.id === epParam) : eps[0];
        setCurrent(found || null);
        if (!epParam && found) {
          params.set("ep", found.id);
          setParams(params, { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grouped = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const ep of episodes) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, []);
      map.get(ep.season_number)!.push(ep);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  const seasons = useMemo(() => grouped.map(([s]) => s), [grouped]);
  const currentIndex = useMemo(() => (current ? episodes.findIndex(e => e.id === current.id) : -1), [episodes, current]);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const [seasonSelect, setSeasonSelect] = useState<number | null>(null);
  useEffect(() => {
    if (!current) return;
    setSeasonSelect(current.season_number);
  }, [current]);

  const filteredEpisodes = useMemo(() => {
    const season = seasonSelect ?? (seasons[0] ?? 1);
    const found = grouped.find(([s]) => s === season)?.[1] || [];
    return found;
  }, [grouped, seasonSelect, seasons]);

  const goToEpisode = (ep: Episode | null) => {
    if (!ep) return;
    setCurrent(ep);
    params.set("ep", ep.id);
    setParams(params);
    const el = document.getElementById("watch-player");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!content || !current) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold">{content.title}</h1>
        <div id="watch-player">
          <Player embedUrl={current.embed_url} contentId={content.id} episodeId={current.id} />
        </div>

        <div className="flex items-center gap-2">
          {prevEp && (
            <Button onClick={() => goToEpisode(prevEp)} variant="secondary">Anterior</Button>
          )}
          {nextEp && (
            <Button onClick={() => goToEpisode(nextEp)} className="bg-primary hover:bg-primary/90">Siguiente</Button>
          )}
        </div>

        {/* Header de episodios + selector temporada (estilo referencia) */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold">Episodios completos</h2>
              <span className="text-xs md:text-sm text-muted-foreground">{filteredEpisodes.length} episodio{filteredEpisodes.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Temporada</span>
              <Select
                value={(seasonSelect ?? (seasons[0] ?? 1)).toString()}
                onValueChange={(v) => setSeasonSelect(parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Selecciona temporada" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => (
                    <SelectItem key={s} value={s.toString()}>Temporada {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de episodios */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredEpisodes.map((ep) => (
              <Card key={ep.id} className={`overflow-hidden bg-card border-border transition-transform duration-200 hover:scale-[1.02] ${current?.id === ep.id ? 'ring-1 ring-primary/60' : ''}`}>
                <button
                  className="w-full text-left group"
                  onClick={() => goToEpisode(ep)}
                  onMouseEnter={(e) => {
                    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    const v = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                    if (v) { v.currentTime = 0; v.controls = true; v.play().catch(() => {}); }
                  }}
                  onMouseLeave={(e) => {
                    const v = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                    if (v) { v.pause(); v.currentTime = 0; v.controls = false; }
                  }}
                >
                  <div className="aspect-video w-full bg-muted overflow-hidden relative">
                    {ep.preview_url ? (
                      <video
                        src={ep.preview_url}
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        poster={ep.thumbnail_url || ep.still_url || undefined}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                    ) : ep.embed_url ? (
                      <iframe
                        src={buildPreviewSrc(ep.embed_url)}
                        className="absolute inset-0 w-full h-full"
                        loading="lazy"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                        title={`Ep ${ep.episode_number}`}
                      />
                    ) : ep.thumbnail_url || ep.still_url ? (
                      <img src={(ep.thumbnail_url || ep.still_url) as string} alt={`Ep ${ep.episode_number}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Play className="h-8 w-8" />
                      </div>
                    )}
                    {/* Center big play button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/40 backdrop-blur-sm grid place-items-center scale-95 opacity-80 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200">
                        <Play className="h-6 w-6 md:h-7 md:w-7 text-white" />
                      </div>
                    </div>
                    {/* Dim overlay on hover */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    {/* Persistent bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="bg-gradient-to-t from-black/60 to-transparent pt-10" />
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-white truncate">
                          T{ep.season_number} E{ep.episode_number} {ep.title ? `· ${ep.title}` : ''}
                        </div>
                      </div>
                      {/* Faux progress bar on hover */}
                      <div className="h-1 bg-white/15">
                        <div className="h-full bg-primary/90 w-0 group-hover:w-2/3 transition-all duration-500" />
                      </div>
                    </div>
                    {current?.id === ep.id && (
                      <div className="absolute inset-0 flex items-start pointer-events-none">
                        <span className="m-2 px-2 py-0.5 text-[10px] uppercase tracking-wide bg-primary text-primary-foreground rounded">Reproduciendo</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 pt-2">
                    <div className="text-xs text-muted-foreground">{new Date(ep.created_at || '').toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
