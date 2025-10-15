import { Link } from "react-router-dom";
import { Play, Clock, Crown, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContentCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  contentType: "movie" | "series";
  isPremium: boolean;
  isNew: boolean;
  progress?: number;
}

export const ContentCard = ({
  id,
  title,
  imageUrl,
  contentType,
  isPremium,
  isNew,
  progress,
}: ContentCardProps) => {
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);

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
        if (!error) setFav(true);
      } else {
        const { error } = await (supabase as any)
          .from("favorites")
          .delete()
          .eq("content_id", id)
          .eq("user_id", user.id);
        if (!error) setFav(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/${contentType}/${id}`}
      className="group relative block overflow-hidden rounded-xl bg-card border border-border hover:border-primary transition-all duration-300"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Play className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button en hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-effect">
            <Play className="h-8 w-8 text-primary-foreground fill-current" />
          </div>
        </div>

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

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {progress !== undefined && progress > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{Math.round(progress)}% visto</span>
          </div>
        )}
      </div>
    </Link>
  );
};
