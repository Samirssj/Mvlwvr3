import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

export const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>

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
    </header>
  );
};
