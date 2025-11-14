import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { SearchBar } from "@/components/SearchBar"; // Import SearchBar

export const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

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

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="hidden sm:flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>
        
        <div className="flex-1 flex justify-center px-0 sm:px-4">
          <SearchBar />
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
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
                className="hover:bg-secondary text-xs sm:text-sm px-2 sm:px-4"
              >
                Iniciar sesión
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary hover:bg-primary/90 glow-effect text-xs sm:text-sm px-2 sm:px-4"
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
