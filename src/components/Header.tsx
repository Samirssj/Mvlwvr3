// src/components/Header.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import { Button } from "@/components/ui/button";
import { User, LogOut, UserPlus } from "lucide-react";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  // Obtener sesión actual
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-50 flex justify-center py-2 px-2 sm:px-4 lg:px-6">
      <header className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4 py-1.5 px-2 bg-black/95 backdrop-blur-lg border border-white/5 rounded-lg shadow-2xl">

        {/* LOGO */}
        <Link to="/" className="hidden sm:flex items-center">
          <Logo />
        </Link>

        {/* BARRA DE BÚSQUEDA CENTRADA */}
        <div className="flex-1 flex justify-center px-2 sm:px-4">
          <SearchBar />
        </div>

        {/* BOTONES DERECHA */}
        <div className="flex-shrink-0 flex items-center gap-2">

          {/* SI HAY SESIÓN → MOSTRAR PERFIL + LOGOUT */}
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
            /* SIN SESIÓN → MOSTRAR LOGIN + SIGNUP */
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-gray-300 hover:text-white hidden sm:flex"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-gray-300 hover:text-white flex sm:hidden"
              >
                <User className="h-5 w-5" />
              </Button>

              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary hover:bg-primary/90 text-white glow-effect hidden sm:flex"
              >
                Regístrate
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary hover:bg-primary/90 text-white glow-effect flex sm:hidden"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </header>
    </div>
  );
};
