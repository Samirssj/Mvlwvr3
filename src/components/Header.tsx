import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

export const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false); // solo móvil
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; title: string; image_url: string | null; content_type: "movie" | "series" }>>([]);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      // Mantener overlay abierto mientras el usuario sigue buscando
    }
  };

  // Removed auto-navigation on typing to match Paramount-like UX

  // Fetch results for overlay (Paramount-like preview)
  useEffect(() => {
    const q = searchQuery.trim();
    let abort = false;
    // Mostrar resultados cuando haya texto y (overlay abierto en móvil) o (estemos en desktop)
    if (q.length === 0 || (!searchOpen && !isDesktop)) {
      setResults([]);
      return;
    }
    const run = async () => {
      setLoadingResults(true);
      try {
        // Contains match (any position, case-insensitive)
        let { data, error } = await supabase
          .from("content")
          .select("id,title,image_url,content_type,created_at")
          .ilike("title", `%${q}%`)
          .order("title", { ascending: true })
          .limit(24);
        if (error) { setResults([]); return; }
        if (!abort) setResults((data as any[]) || []);
      } finally {
        if (!abort) setLoadingResults(false);
      }
    };
    const h = setTimeout(run, 100);
    return () => { abort = true; clearTimeout(h); };
  }, [searchQuery, searchOpen, isDesktop]);

  // Close with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev || "";
    }
    return () => { document.body.style.overflow = prev || ""; };
  }, [searchOpen]);

  // Track viewport to decide desktop vs móvil
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>
        {/* Desktop inline search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar películas y series..."
              className="pl-10 bg-secondary border-border focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <nav className="flex items-center gap-2">
          {/* Icono de búsqueda solo en móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-secondary"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          {session ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="hover:bg-secondary hover:text-primary"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-secondary hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hover:bg-secondary"
              >
                Iniciar sesión
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary hover:bg-primary/90 glow-effect"
              >
                Registrarse
              </Button>
            </>
          )}
        </nav>
      </div>

      {/* Full-screen search overlay (móvil) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="mx-auto max-w-3xl relative">
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setSearchOpen(false)}
                className="absolute -top-2 right-0 sm:-top-4 sm:right-0 rounded-md p-2 hover:bg-secondary border border-transparent hover:border-border"
              >
                <X className="h-5 w-5" />
              </button>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Buscar películas y series..."
                    className="pl-12 h-12 rounded-xl bg-card border-border focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 pb-8">
              {searchQuery.trim().length === 0 ? (
                <div className="text-center text-muted-foreground py-10">Empieza a escribir para ver resultados</div>
              ) : loadingResults ? (
                <div className="text-center text-muted-foreground py-10">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">Sin resultados.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      to={r.content_type === "series" ? `/series/${r.id}` : `/movie/${r.id}`}
                      className="group"
                      onClick={() => setSearchOpen(false)}
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-secondary">
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.title} className="h-full w-full object-cover group-hover:opacity-90 transition" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
                        )}
                      </div>
                      <div className="mt-2 text-sm line-clamp-2">{r.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop live results below header */}
      {isDesktop && searchQuery.trim().length > 0 && (
        <div className="hidden md:block border-t border-border bg-background/95">
          <div className="container mx-auto px-4 py-3">
            {loadingResults ? (
              <div className="text-sm text-muted-foreground">Buscando...</div>
            ) : results.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin resultados.</div>
            ) : (
              <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {results.map((r) => (
                  <Link key={r.id} to={r.content_type === "series" ? `/series/${r.id}` : `/movie/${r.id}`} className="group">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-secondary">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="h-full w-full object-cover group-hover:opacity-90 transition" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
                      )}
                    </div>
                    <div className="mt-1 text-xs line-clamp-2">{r.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
