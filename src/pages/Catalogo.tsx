import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ContentCard } from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
  categories: string[] | null;
}

export default function Catalogo() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);

  // filtros
  const [type, setType] = useState<"all" | "free" | "premium">("all");
  const [kind, setKind] = useState<"all" | "movie" | "series">("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, kind, category]);

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase.from("content").select("*").order("created_at", { ascending: false });

      if (kind !== "all") {
        query = query.eq("content_type", kind);
      }
      if (type !== "all") {
        query = query.eq("is_premium", type === "premium");
      }
      if (category.trim()) {
        // categories es TEXT[]; usamos contains con un arreglo que contenga la categoría
        query = query.contains("categories", [category.trim()]);
      }

      const { data, error } = await query.limit(60);
      if (error) throw error;
      setItems((data as ContentItem[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter((it) => it.title.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Catálogo</h1>
        </div>

        <Card className="p-4 bg-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de acceso</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contenido</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="movie">Películas</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoría</Label>
              <Input
                className="mt-1"
                placeholder="Acción, Drama, Anime..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <Label>Buscar</Label>
              <Input
                className="mt-1"
                placeholder="Buscar por título"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-3">
            <Button variant="outline" onClick={load}>
              Aplicar filtros
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No hay resultados.</Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((c) => (
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
