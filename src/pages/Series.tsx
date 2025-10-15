import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CarouselRow } from "@/components/CarouselRow";
import { ContentCard } from "@/components/ContentCard";

import Player from "@/components/Player";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, Sparkles, Play } from "lucide-react";

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
        setEpisodes((epsData as Episode[]) || []);
        setCurrent((epsData && epsData[0]) || null);
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
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl space-y-6">
        <div className="space-y-2">
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
          <h1 className="text-2xl md:text-3xl font-bold">{content.title}</h1>
        </div>

        {current ? (
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
        )}

        {content.description && (
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content.description}
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {grouped.map(([season, eps]) => (
            <Card key={season} className="p-4 bg-card border-border">
              <h3 className="font-semibold mb-3">Temporada {season}</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {eps.map((ep) => (
                  <Button
                    key={ep.id}
                    variant={current?.id === ep.id ? "default" : "outline"}
                    className={
                      current?.id === ep.id
                        ? "justify-start glow-effect"
                        : "justify-start"
                    }
                    onClick={() => setCurrent(ep)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ep {ep.episode_number}
                    {ep.title ? `: ${ep.title}` : ""}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
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