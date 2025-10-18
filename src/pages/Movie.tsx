import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CarouselRow } from "@/components/CarouselRow";
import { ContentCard } from "@/components/ContentCard";
import Player from "@/components/Player";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, Sparkles } from "lucide-react";

type Content = {
  id: string;
  title: string;
  description: string | null;
  embed_url: string;
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
  release_date: string | null;
  metadata: any;
  created_at?: string;
};

export default function Movie() {

  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content | null>(null);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("id", id)
          .eq("content_type", "movie")
          .single();
        if (error) throw error;
        setContent(data as Content);
      } catch {
        navigate("/"); // si no existe, vuelve a home
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  // SEO: dynamic title and description
  useEffect(() => {
    if (!content) return;
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    document.title = `${content.title} | Mvlwvr3`;
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute('content', content.description || 'Ver película en Mvlwvr3');
    return () => {
      document.title = prevTitle;
      meta.setAttribute('content', prevDesc);
    };
  }, [content]);

  useEffect(() => {
    const loadAux = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Continuar viendo (usuario actual)
      if (user) {
        const { data } = await supabase
          .from("watch_progress")
          .select("content:content_id(id,title,image_url,content_type,is_premium,is_new), progress_seconds, last_watched_at")
          .eq("user_id", user.id)
          .order("last_watched_at", { ascending: false })
          .limit(24);
        const items = (data || [])
          .map((r: any) => ({ ...r.content, progress: r.progress_seconds }))
          .filter((c: any) => c && c.id && c.content_type === "movie");
        const unique = Array.from(new Map(items.map((c: any) => [c.id, c])).values());
        setContinueWatching(unique);
      }

      // Similares: películas recientes distintas a la actual
      if (id) {
        const { data: sim } = await supabase
          .from("content")
          .select("*")
          .eq("content_type", "movie")
          .neq("id", id)
          .order("created_at", { ascending: false })
          .limit(18);
        setSimilar(sim || []);
      }

      // Tendencia: basadas en watch_progress
      const { data: views } = await supabase
        .from("watch_progress")
        .select("content:content_id(id,title,image_url,content_type,is_premium,is_new), last_watched_at")
        .order("last_watched_at", { ascending: false })
        .limit(100);
      const items2 = (views || [])
        .map((r: any) => r.content)
        .filter((c: any) => c && c.id && c.content_type === "movie" && c.id !== id);
      const unique2 = Array.from(new Map(items2.map((c: any) => [c.id, c])).values()).slice(0, 18);
      setTrending(unique2);
    };
    loadAux();
  }, [id]);

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
            {(() => {
              const now = Date.now();
              const created = content.created_at ? new Date(content.created_at).getTime() : 0;
              const isRecent = created > 0 && (now - created) <= 10 * 24 * 60 * 60 * 1000;
              return (content.is_new || isRecent) ? (
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" /> Nuevo
                </Badge>
              ) : null;
            })()}
            {content.is_premium && (
              <Badge variant="secondary">
                <Crown className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{content.title}</h1>
        </div>

        <Player embedUrl={content.embed_url} contentId={content.id} />

        {content.description && (
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content.description}
            </p>
          </Card>
        )}

        {/* Continuar viendo */}
        {continueWatching.length > 0 && (
          <CarouselRow title="Continuar viendo">
            {continueWatching.map((c: any) => (
              <div key={c.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={c.id}
                  title={c.title}
                  imageUrl={c.image_url || undefined}
                  contentType={c.content_type}
                  isPremium={c.is_premium}
                  isNew={c.is_new}
                  progress={c.progress ? Math.min((c.progress / (60 * 60)) * 100, 100) : undefined}
                />
              </div>
            ))}
          </CarouselRow>
        )}

        {/* Similares */}
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

        {/* Tendencia */}
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