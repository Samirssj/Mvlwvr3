import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { SearchBar } from "@/components/SearchBar"; // Import the new SearchBar

export const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
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


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className={`fixed top-0 w-full z-50 bg-transparent border-none shadow-none transition-transform duration-300 will-change-transform ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-electric bg-clip-text text-transparent">
            Mvlwvr3
          </div>
        </Link>
        
        {/* Centered SearchBar */}
        <div className="flex-1 flex justify-center px-4">
          <SearchBar />
        </div>

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
