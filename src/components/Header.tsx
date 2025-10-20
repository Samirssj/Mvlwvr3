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
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; title: string; image_url: string | null; content_type: "movie" | "series" }>>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

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
    if (q.length === 0 || !searchOpen) {
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
    run();
    return () => { abort = true; };
  }, [searchQuery, searchOpen]);

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

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset;
        const delta = y - lastY;
        const threshold = 8; // sensibilidad
        if (y < 64) {
          setIsHidden(false);
        } else if (delta > threshold) {
          setIsHidden(true);
        } else if (delta < -threshold) {
          setIsHidden(false);
        }
        setLastY(y);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, [lastY]);

  return (
    <header className={`fixed top-0 w-full z-50 bg-transparent border-none shadow-none transition-transform duration-300 will-change-transform ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>
        {/* Center spacer keeps brand left and actions right */}
        <div className="flex-1" />

        <nav className="flex items-center gap-2">
          {/* Single search icon (mobile + desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
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

      {/* Full-screen search overlay */}
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
    </header>
  );
};
