import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { ContentCard } from "@/components/ContentCard";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search as SearchIcon } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Search() {
  const params = useQuery();
  const q = params.get("q")?.trim() || "";
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (!q) {
          setItems([]);
          return;
        }
        // Búsqueda simple por título con ILIKE
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .ilike("title", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(60);
        if (error) throw error;
        setItems((data as ContentItem[]) || []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Buscar</h1>
        </div>
        <p className="text-sm text-muted-foreground">Resultados para: <strong>{q || ""}</strong></p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !q ? (
          <Card className="p-8 text-center text-muted-foreground">
            Escribe algo en la búsqueda para ver resultados.
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Sin resultados.</Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((c) => (
              <ContentCard
                key={c.id}
                id={c.id}
                title={c.title}
                imageUrl={c.image_url || undefined}
                contentType={c.content_type}
                isPremium={c.is_premium}
                isNew={c.is_new}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
