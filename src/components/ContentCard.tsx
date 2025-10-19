import { Link } from "react-router-dom";
import { Play, Crown, Heart } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContentCardProps {
  id: string;
  imageUrl?: string;
  contentType: "movie" | "series";
  isPremium: boolean;
  isNew: boolean;
}

export const ContentCard = memo(({
  id,
  imageUrl,
  contentType,
  isPremium,
  isNew,
}: ContentCardProps) => {
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const href = `/${contentType}/${id}`;

  const prefetch = () => {
    try {
      // Prefetch route navigation hint
      const sel = `link[rel="prefetch"][href='${href}']`;
      if (!document.head.querySelector(sel)) {
        const l = document.createElement("link");
        l.rel = "prefetch";
        l.as = "document";
        l.href = href;
        document.head.appendChild(l);
      }
      // Prefetch image
      if (imageUrl) {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = imageUrl;
      }
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_id", id)
        .maybeSingle();
      if (mounted) setFav(!!data);
    })();
    return () => { mounted = false; };
  }, [id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (!fav) {
        const { error } = await (supabase as any).from("favorites").insert({ user_id: user.id, content_id: id });
        if (!error) {
          setFav(true);
          trackEvent("favorite_toggle", { content_id: id, is_favorite: true });
        }
      } else {
        const { error } = await (supabase as any)
          .from("favorites")
          .delete()
          .eq("content_id", id)
          .eq("user_id", user.id);
        if (!error) {
          setFav(false);
          trackEvent("favorite_toggle", { content_id: id, is_favorite: false });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-xl bg-card border border-border hover:border-primary transition-all duration-300"
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Movie Poster"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 16vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Play className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Badges superior */}
        <div className="absolute top-2 left-2 flex gap-2">
          {isNew && (
            <Badge className="bg-primary text-primary-foreground border-0 glow-effect">
              NUEVO
            </Badge>
          )}
          {isPremium && (
            <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <div className="absolute top-2 right-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-background/70 hover:bg-background/90 border border-border"
            onClick={toggleFavorite}
            disabled={loading}
            aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </Button>
        </div>
      </div>
    </Link>
  );
});
