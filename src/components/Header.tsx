// src/components/Header.tsx
import { Link } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";

export const Header: React.FC = () => {
  return (
    <div className="sticky top-0 z-50 flex justify-center py-2 px-2 sm:px-4 lg:px-6">
      <header className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4 py-1.5 px-2 bg-black/95 backdrop-blur-lg border border-white/5 rounded-lg shadow-2xl">

        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex-1 flex justify-center px-2 sm:px-4">
          <SearchBar />
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <Link 
            to="/login"
            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-md whitespace-nowrap"
          >
            Iniciar Sesión
          </Link>

          <Link
            to="/register"
            className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-md whitespace-nowrap glow-effect"
          >
            Regístrate
          </Link>
        </div>

      </header>
    </div>
  );
};
