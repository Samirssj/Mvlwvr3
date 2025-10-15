import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ContentCard } from "@/components/ContentCard";
import { CarouselRow } from "@/components/CarouselRow";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Play, TrendingUp, Film, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Content {
  id: string;
  title: string;
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [newReleases, setNewReleases] = useState<Content[]>([]);
  const [movies, setMovies] = useState<Content[]>([]);
  const [series, setSeries] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  useEffect(() => {
    loadContent();
    loadContinueWatching();
  }, []);

  const loadContent = async () => {
    try {
      const { data: newContent } = await supabase
        .from("content")
        .select("*")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(6);

      const { data: movieContent } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "movie")
        .order("created_at", { ascending: false })
        .limit(12);

      const { data: seriesContent } = await supabase
        .from("content")
        .select("*")
        .eq("content_type", "series")
        .order("created_at", { ascending: false })
        .limit(12);

      setNewReleases(newContent || []);
      setMovies(movieContent || []);
      setSeries(seriesContent || []);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueWatching = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("watch_progress")
        .select("content:content_id(id,title,image_url,content_type,is_premium,is_new), progress_seconds, last_watched_at")
        .eq("user_id", user.id)
        .order("last_watched_at", { ascending: false })
        .limit(24);
      const items = (data || [])
        .map((r: any) => ({ ...r.content, progress: r.progress_seconds }))
        .filter((c: any) => c && c.id);
      const unique = Array.from(new Map(items.map((c: any) => [c.id, c])).values());
      setContinueWatching(unique);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(226_100%_50%_/_0.1)_0%,_transparent_65%)]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-electric bg-clip-text text-transparent">
                Películas y Series
              </span>
              <br />
              <span className="text-foreground">Sin Límites</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Disfruta de miles de títulos en streaming. Nuevo contenido cada semana.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg glow-effect"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                Comienza Gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate("/plans")}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Ver Planes
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
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

        {/* Estrenos */}
        {newReleases.length > 0 && (
          <CarouselRow title="Estrenos">
            {newReleases.map((content) => (
              <div key={content.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={content.id}
                  title={content.title}
                  imageUrl={content.image_url || undefined}
                  contentType={content.content_type}
                  isPremium={content.is_premium}
                  isNew={content.is_new}
                />
              </div>
            ))}
          </CarouselRow>
        )}

        {/* Películas */}
        {movies.length > 0 && (
          <CarouselRow title="Películas Populares">
            {movies.map((content) => (
              <div key={content.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={content.id}
                  title={content.title}
                  imageUrl={content.image_url || undefined}
                  contentType={content.content_type}
                  isPremium={content.is_premium}
                  isNew={content.is_new}
                />
              </div>
            ))}
          </CarouselRow>
        )}

        {/* Series */}
        {series.length > 0 && (
          <CarouselRow title="Series Destacadas">
            {series.map((content) => (
              <div key={content.id} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
                <ContentCard
                  id={content.id}
                  title={content.title}
                  imageUrl={content.image_url || undefined}
                  contentType={content.content_type}
                  isPremium={content.is_premium}
                  isNew={content.is_new}
                />
              </div>
            ))}
          </CarouselRow>
        )}

        {!loading && newReleases.length === 0 && movies.length === 0 && series.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No hay contenido disponible aún. ¡Vuelve pronto!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © 2025 Mvlwvr3. Plataforma de streaming. Contenido para mayores de 18 años.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
