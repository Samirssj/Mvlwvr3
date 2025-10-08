import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
};

export default function Movie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content | null>(null);

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

        <Player embedUrl={content.embed_url} contentId={content.id} />

        {content.description && (
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content.description}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}