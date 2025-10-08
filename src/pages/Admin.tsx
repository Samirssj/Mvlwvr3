import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Loader2, Shield, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipos mínimos
interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  embed_url: string;
  image_url: string | null;
  content_type: "movie" | "series";
  is_premium: boolean;
  is_new: boolean;
  categories: string[] | null;
  release_date: string | null;
  metadata: any;
}

type ContentInsert = Database["public"]["Tables"]["content"]["Insert"];
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"];

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ContentItem[]>([]);

  // Formulario de contenido
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contentType, setContentType] = useState<"movie" | "series">("movie");
  const [isPremium, setIsPremium] = useState("false");
  const [isNew, setIsNew] = useState("false");
  const [releaseDate, setReleaseDate] = useState("");
  const [categories, setCategories] = useState("");
  const [metadata, setMetadata] = useState("{\n  \"year\": 2025,\n  \"duration\": 120,\n  \"actors\": []\n}");

  // Generador de episodios
  const [seriesId, setSeriesId] = useState("");
  const [season, setSeason] = useState(1);
  const [episodesText, setEpisodesText] = useState("");

  // Verificación de rol admin
  useEffect(() => {
    const check = async () => {
      try {
        const { data: auth } = await supabase.auth.getSession();
        const user = auth.session?.user;
        if (!user) {
          navigate("/auth");
          return;
        }
        // Extra capa: solo el admin definido por email puede ingresar si está configurado
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
        if (ADMIN_EMAIL && user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          navigate("/");
          return;
        }
        // Verificar rol en user_roles
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");
        if (error) throw error;
        const ok = (roles?.length || 0) > 0;
        setIsAdmin(ok);
        if (!ok) {
          navigate("/");
        } else {
          await loadList();
        }
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [navigate]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setEmbedUrl("");
    setImageUrl("");
    setContentType("movie");
    setIsPremium("false");
    setIsNew("false");
    setReleaseDate("");
    setCategories("");
    setMetadata("{\n  \"year\": 2025\n}");
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setList((data as ContentItem[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const upsertContent = async () => {
    setLoading(true);
    try {
      let cats: string[] | null = null;
      if (categories.trim()) {
        cats = categories.split(",").map((s) => s.trim()).filter(Boolean);
      }
      let meta: ContentInsert["metadata"] = {} as any;
      try { meta = (metadata ? JSON.parse(metadata) : {}) as any; } catch { meta = {} as any; }

      const insertPayload: ContentInsert = {
        title: title.trim(),
        description: description.trim() || null,
        embed_url: embedUrl.trim(),
        image_url: imageUrl.trim() || null,
        content_type: contentType,
        is_premium: isPremium === "true",
        is_new: isNew === "true",
        categories: cats || null,
        release_date: (releaseDate || null) as any,
        metadata: meta,
      };

      if (editingId) {
        const updatePayload: Partial<ContentUpdate> = insertPayload;
        const { error } = await supabase.from("content").update(updatePayload).eq("id", editingId);
        if (error) throw error;
        await supabase.from("admin_logs").insert({ action: "update_content", details: updatePayload as any });
        toast({ title: "Contenido actualizado" });
      } else {
        const { error } = await supabase.from("content").insert(insertPayload);
        if (error) throw error;
        await supabase.from("admin_logs").insert({ action: "create_content", details: insertPayload as any });
        toast({ title: "Contenido creado" });
      }
      resetForm();
      await loadList();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const editRow = (row: ContentItem) => {
    setEditingId(row.id);
    setTitle(row.title || "");
    setDescription(row.description || "");
    setEmbedUrl(row.embed_url || "");
    setImageUrl(row.image_url || "");
    setContentType(row.content_type);
    setIsPremium(String(row.is_premium));
    setIsNew(String(row.is_new));
    setReleaseDate(row.release_date || "");
    setCategories((row.categories || []).join(", "));
    setMetadata(JSON.stringify(row.metadata || {}, null, 2));
  };

  const deleteRow = async (id: string) => {
    if (!confirm("¿Eliminar este contenido?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("content").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ action: "delete_content", details: { id } });
      toast({ title: "Contenido eliminado" });
      await loadList();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const seriesOptions = useMemo(() => list.filter((l) => l.content_type === "series"), [list]);

  const generateEpisodes = async () => {
    if (!seriesId) {
      toast({ variant: "destructive", title: "Selecciona una serie" });
      return;
    }
    const links = episodesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (links.length === 0) {
      toast({ variant: "destructive", title: "Pega enlaces de episodios" });
      return;
    }
    setLoading(true);
    try {
      const rows = links.map((url, idx) => ({
        content_id: seriesId,
        episode_number: idx + 1,
        season_number: Number(season) || 1,
        title: null,
        embed_url: url,
      }));
      const { error } = await supabase.from("episodes").insert(rows);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ action: "create_episodes", details: { seriesId, count: rows.length } });
      toast({ title: "Episodios generados", description: `${rows.length} episodios creados` });
      setEpisodesText("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12 space-y-8 max-w-6xl">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>

        {/* Formulario de Contenido */}
        <Card className="p-6 bg-card border-border space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? "Editar contenido" : "Nuevo contenido"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            </div>
            <div>
              <Label>Imagen (URL)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Embed URL</Label>
              <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Película</SelectItem>
                  <SelectItem value="series">Serie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acceso</Label>
              <Select value={isPremium} onValueChange={setIsPremium}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Acceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Gratis</SelectItem>
                  <SelectItem value="true">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estreno</Label>
              <Select value={isNew} onValueChange={setIsNew}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Estreno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de estreno</Label>
              <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Categorías (separadas por coma)</Label>
              <Input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Acción, Drama, Anime" />
            </div>
            <div className="md:col-span-2">
              <Label>Metadata (JSON)</Label>
              <Textarea rows={6} value={metadata} onChange={(e) => setMetadata(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={upsertContent} className="bg-primary hover:bg-primary/90 glow-effect">
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Guardar cambios" : "Crear"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </Card>

        {/* Lista */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-lg font-semibold mb-4">Contenido</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((row) => (
                <div key={row.id} className="border border-border rounded-lg p-3 bg-secondary/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{row.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.content_type} • {row.is_premium ? "Premium" : "Gratis"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => editRow(row)} title="Editar">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteRow(row.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Generación de episodios */}
        <Card className="p-6 bg-card border-border space-y-4">
          <h2 className="text-lg font-semibold">Generar episodios por lista</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Serie</Label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una serie" />
                </SelectTrigger>
                <SelectContent>
                  {seriesOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temporada</Label>
              <Input type="number" min={1} value={season} onChange={(e) => setSeason(parseInt(e.target.value || "1", 10))} />
            </div>
            <div className="md:col-span-2">
              <Label>Lista de links (uno por línea)</Label>
              <Textarea
                rows={6}
                placeholder={"https://embed1...\nhttps://embed2..."}
                value={episodesText}
                onChange={(e) => setEpisodesText(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={generateEpisodes} className="bg-primary hover:bg-primary/90 glow-effect">
            Generar episodios
          </Button>
        </Card>
      </div>
    </div>
  );
}
