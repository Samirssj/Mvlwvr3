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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; title: string; image_url: string | null; content_type: "movie" | "series" }>>([]);

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
    }
  };

  // Live search (debounced) for both desktop and mobile inputs
  useEffect(() => {
    const q = searchQuery.trim();
    const t = setTimeout(() => {
      if (q.length > 0) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, navigate]);

  // Fetch inline results for overlay (Paramount-like preview)
  useEffect(() => {
    const q = searchQuery.trim();
    let abort = false;
    if (q.length === 0) {
      setResults([]);
      return;
    }
    const run = async () => {
      setLoadingResults(true);
      try {
        const { data, error } = await supabase
          .from("content")
          .select("id,title,image_url,content_type")
          .ilike("title", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(12);
        if (error) throw error;
        if (!abort) setResults((data as any[]) || []);
      } finally {
        if (!abort) setLoadingResults(false);
      }
    };
    const h = setTimeout(run, 250);
    return () => { abort = true; clearTimeout(h); };
  }, [searchQuery]);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>

        {/* Extra mobile search icon near logo to ensure visibility */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-secondary"
          aria-label="Buscar"
          onClick={() => setShowMobileSearch((s) => !s)}
        >
          {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar películas y series..."
              className="pl-10 bg-secondary border-border focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <nav className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-secondary"
            aria-label="Buscar"
            onClick={() => setShowMobileSearch((s) => !s)}
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
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
      {/* Mobile search bar (slide-down) */}
      {showMobileSearch && (
        <div className="md:hidden border-t border-border bg-background/95">
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  type="search"
                  placeholder="Buscar películas y series..."
                  className="pl-10 bg-secondary border-border focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          {/* Mobile inline results */}
          {(searchQuery.trim().length > 0) && (
            <div className="border-t border-border bg-background">
              <div className="container mx-auto px-4 pb-3">
                {loadingResults ? (
                  <div className="py-3 text-sm text-muted-foreground">Buscando...</div>
                ) : results.length === 0 ? (
                  <div className="py-3 text-sm text-muted-foreground">Sin resultados.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
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
        </div>
      )}

      {/* Desktop inline results below header */}
      {searchQuery.trim().length > 0 && (
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
