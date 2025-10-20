import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import Player from "@/components/Player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Content = {
  id: string;
  title: string;
  embed_url: string;
};

export default function WatchMovie() {
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
          .select("id,title,embed_url,content_type")
          .eq("id", id)
          .eq("content_type", "movie")
          .single();
        if (error) throw error;
        setContent({ id: data.id, title: data.title, embed_url: data.embed_url });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!content) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl space-y-4">
        <h1 className="text-xl md:text-2xl font-semibold">{content.title}</h1>
        <div id="watch-player">
          <Player embedUrl={content.embed_url} contentId={content.id} />
        </div>

        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground">Disfruta tu película.</div>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
