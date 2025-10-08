import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
};

export default function Series() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [current, setCurrent] = useState<Episode | null>(null);

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
      </div>
    </div>
  );
}