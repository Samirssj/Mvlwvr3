import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CarouselRow } from "@/components/CarouselRow";
import { ContentCard } from "@/components/ContentCard";

import Player from "@/components/Player";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, Sparkles, Play } from "lucide-react";

const cleanTitle = (title: string | null | undefined, ep: { episode_number: number }): string => {
  const raw = (title || '').trim();
  if (!raw) return `E${ep.episode_number}`;
  const patterns: RegExp[] = [
    /^T\s*\d+\s*E\s*\d+\s*[·:,-]?\s*/i,
    /^S\s*\d+\s*E\s*\d+\s*[·:,-]?\s*/i,
    /^Episodio\s*\d+\s*[·:,-]?\s*/i,
    /^E\s*\d+\s*[·:,-]?\s*/i,
  ];
  let out = raw;
  for (const rx of patterns) out = out.replace(rx, '');
  out = out.trim();
  return out || `E${ep.episode_number}`;
};

const buildPreviewSrc = (raw: string): string => {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
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
    const params = u.searchParams;
    if (!params.has("autoplay")) params.set("autoplay", "1");
    if (!params.has("mute")) params.set("mute", "1");
    u.search = params.toString();
    return u.toString();
  } catch {
    return raw;
  }
};

type Content = {
  id: string;
  title: string;
  description: string | null;
  embed_url: string; // podría no usarse si se prefiere el de episodio
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
  release_date: string | null;
  metadata: any;
};

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

export default function Series() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [current, setCurrent] = useState<Episode | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: contentData, error: cErr } = await supabase
          .from("content")
          .select("*")
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

        setContent(contentData as Content);
        const eps = (epsData as Episode[]) || [];
        setEpisodes(eps);
        setCurrent((eps && eps[0]) || null);
        if (eps && eps.length > 0) setSelectedSeason(eps[0].season_number);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!content) return;
    // SEO: dynamic title and description
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    document.title = `${content.title} | Mvlwvr3`;
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute('content', content.description || 'Ver serie en Mvlwvr3');
    return () => {
      document.title = prevTitle;
      meta.setAttribute('content', prevDesc);
    };
  }, [content]);

  useEffect(() => {
    if (!content) return;
    const run = async () => {
      // Similares: mismo tipo, recientes, excluye el actual
      const { data: sim } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "series")
        .neq("id", content.id)
        .order("created_at", { ascending: false })
        .limit(18);
      let similarItems = sim || [];

      // Tendencia: últimos vistos, deduplicado por content
      const { data: views } = await supabase
        .from("watch_progress")
        .select("content:content_id(id,title,image_url,content_type,is_premium,is_new), last_watched_at")
        .order("last_watched_at", { ascending: false })
        .limit(100);
      const items = (views || [])
        .map((r: any) => r.content)
        .filter((c: any) => c && c.id && c.content_type === "series" && c.id !== content.id);
      let trendingItems = Array.from(new Map(items.map((c: any) => [c.id, c])).values()).slice(0, 18);

      // Marcar como NUEVO si hubo episodios en últimos 10 días
      const candidates = [...similarItems, ...trendingItems];
      if (candidates.length > 0) {
        const ids = Array.from(new Set(candidates.map((c: any) => c.id)));
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const { data: eps } = await supabase
          .from("episodes")
          .select("content_id, created_at")
          .in("content_id", ids)
          .gte("created_at", tenDaysAgo)
          .limit(1000);
        const recentSet = new Set((eps || []).map((e: any) => e.content_id));
        similarItems = similarItems.map((s: any) => ({ ...s, is_new: s.is_new || recentSet.has(s.id) }));
        trendingItems = trendingItems.map((s: any) => ({ ...s, is_new: s.is_new || recentSet.has(s.id) }));
      }

      setSimilar(similarItems);
      setTrending(trendingItems);
    };
    run();
  }, [content]);

  const grouped = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const ep of episodes) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, []);
      map.get(ep.season_number)!.push(ep);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  const seasons = useMemo(() => grouped.map(([s]) => s), [grouped]);
  const filteredEpisodes = useMemo(() => {
    if (!selectedSeason) return [] as Episode[];
    const found = grouped.find(([s]) => s === selectedSeason);
    return (found?.[1] || []).slice();
  }, [grouped, selectedSeason]);

  // Al cambiar de temporada, autoseleccionar primer episodio de esa temporada
  useEffect(() => {
    if (filteredEpisodes.length > 0) {
      setCurrent((prev) => (prev && prev.season_number === filteredEpisodes[0].season_number ? prev : filteredEpisodes[0]));
    }
  }, [selectedSeason]);

  const metaInfo = useMemo(() => {
    const year = content?.release_date ? new Date(content.release_date).getFullYear() : undefined;
    const genres = (content?.metadata?.genres as string[] | undefined) || (content?.metadata?.genre ? [content.metadata.genre] : []);
    const seasonsCount = seasons.length;
    return { year, genres, seasonsCount };
  }, [content, seasons]);

  const [inMyList, setInMyList] = useState(false);
  const toggleMyList = () => setInMyList((v) => !v);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero estilo Disney+: fondo con imagen y panel en esquina */}
      <section className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
        {((content as any)?.metadata?.hero_image_url || content.image_url) && (
          <img
            src={(content as any)?.metadata?.hero_image_url || content.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}
        {/* Overlays suaves para contraste sin perder nitidez */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />
        <div className="container mx-auto px-4 h-full max-w-6xl relative">
          <div className="absolute bottom-6 left-4 md:left-6 w-[92%] md:w-[60%] space-y-3">
            <div className="flex items-center gap-2">
              {content.is_new && (
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" /> Nuevo
                </Badge>
              )}
              {content.is_premium && (
                <Badge variant="secondary">
                  <Crown className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
              {/* Badges de novedades (últimos 10 días) */}
              {(() => {
                const now = Date.now();
                const recent = episodes.some((ep) => ep.created_at && (now - new Date(ep.created_at).getTime()) <= 10 * 24 * 60 * 60 * 1000);
                let newSeason = false;
                if (episodes.length > 0) {
                  const seasons = Array.from(new Set(episodes.map((e) => e.season_number))).sort((a, b) => a - b);
                  const latest = seasons[seasons.length - 1];
                  const latestRecent = episodes.some((e) => e.season_number === latest && e.created_at && (now - new Date(e.created_at).getTime()) <= 10 * 24 * 60 * 60 * 1000);
                  newSeason = latestRecent && seasons.length > 1;
                }
                return (
                  <>
                    {recent && (
                      <Badge className="bg-green-600/90 text-white">
                        <Sparkles className="h-3 w-3 mr-1" /> Nuevos episodios
                      </Badge>
                    )}
                    {newSeason && (
                      <Badge className="bg-blue-600/90 text-white">
                        <Sparkles className="h-3 w-3 mr-1" /> Nueva temporada
                      </Badge>
                    )}
                  </>
                );
              })()}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{content.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
              {metaInfo.genres && metaInfo.genres.length > 0 && (
                <span>{metaInfo.genres.slice(0, 2).join(' · ')}</span>
              )}
              {metaInfo.year && (
                <>
                  <span>·</span>
                  <span>{metaInfo.year}</span>
                </>
              )}
              {metaInfo.seasonsCount > 0 && (
                <>
                  <span>·</span>
                  <span>{metaInfo.seasonsCount} {metaInfo.seasonsCount === 1 ? 'temporada' : 'temporadas'}</span>
                </>
              )}
            </div>
            {content.description && (
              <p className="text-sm md:text-base text-muted-foreground line-clamp-4 md:line-clamp-5 max-w-prose">
                {content.description}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 glow-effect"
                onClick={() => {
                  if (episodes.length > 0) {
                    const first = episodes[0];
                    navigate(`/watch/series/${content.id}?ep=${first.id}`);
                  } else {
                    navigate(`/watch/series/${content.id}`);
                  }
                }}
              >
                VER AHORA
              </Button>
              <Button variant="secondary" size="lg" onClick={toggleMyList}>
                {inMyList ? 'EN MI LISTA' : 'MI LISTA'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 max-w-6xl space-y-6">
        <div id="series-player">
          {showPlayer && (
            current ? (
              <Player
                embedUrl={current.embed_url}
                contentId={content.id}
                episodeId={current.id}
              />
            ) : (
              <Card className="p-4 bg-card border-border">
                <p className="text-sm text-muted-foreground">
                  No hay episodios disponibles para esta serie.
                </p>
              </Card>
            )
          )}
        </div>

        {/* Episodios completos + selector de temporada inline */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold">Episodios completos</h2>
              <span className="text-xs md:text-sm text-muted-foreground">{filteredEpisodes.length} episodio{filteredEpisodes.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Temporada</span>
              <Select
                value={(selectedSeason ?? (seasons[0] ?? 1)).toString()}
                onValueChange={(v) => setSelectedSeason(parseInt(v))}
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

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredEpisodes.map((ep) => (
              <Card key={ep.id} className={`overflow-hidden bg-card border-border transition-transform duration-200 hover:scale-[1.02] ${current?.id === ep.id ? 'ring-1 ring-primary/60' : ''}`}>
                <button
                  className="w-full text-left group"
                  onClick={() => {
                    navigate(`/watch/series/${content.id}?ep=${ep.id}`);
                  }}
                  onMouseEnter={(e) => {
                    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    const v = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                    if (v) {
                      v.currentTime = 0;
                      v.play().catch(() => {});
                    }
                  }}
                  onMouseLeave={(e) => {
                    const v = e.currentTarget.querySelector('video') as HTMLVideoElement | null;
                    if (v) {
                      v.pause();
                      v.currentTime = 0;
                    }
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
                        controls={false}
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        disablePictureInPicture
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
                      <div className="w-full h-full bg-muted" />
                    )}
                    {current?.id === ep.id && (
                      <div className="absolute inset-0 flex items-start pointer-events-none">
                        <span className="m-2 px-2 py-0.5 text-[10px] uppercase tracking-wide bg-primary text-primary-foreground rounded">Reproduciendo</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-sm font-semibold truncate">{ep.title ? ep.title : `E${ep.episode_number}`}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(ep.created_at)} {`· T${ep.season_number} E${ep.episode_number}`}</div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Recomendaciones: Similares */}
        {similar.length > 0 && (
          <CarouselRow title="Similares">
            {similar.map((c: any) => (
              <div key={c.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={c.id}
                  title={c.title}
                  imageUrl={c.image_url || undefined}
                  contentType={c.content_type}
                  isPremium={c.is_premium}
                  isNew={c.is_new}
                />
              </div>
            ))}
          </CarouselRow>
        )}

        {/* Recomendaciones: Tendencia */}
        {trending.length > 0 && (
          <CarouselRow title="Tendencia">
            {trending.map((c: any) => (
              <div key={c.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={c.id}
                  title={c.title}
                  imageUrl={c.image_url || undefined}
                  contentType={c.content_type}
                  isPremium={c.is_premium}
                  isNew={c.is_new}
                />
              </div>
            ))}
          </CarouselRow>
        )}
      </div>
    </div>
  );
}