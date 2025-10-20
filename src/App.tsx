import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import Movie from "./pages/Movie";   // + añadido
import Series from "./pages/Series"; // + añadido
import Checkout from "./pages/Checkout"; // + añadido
import PaymentSuccess from "./pages/PaymentSuccess"; // + añadido
import Catalogo from "./pages/Catalogo"; // + añadido
import Search from "./pages/Search"; // + añadido
import Admin from "./pages/Admin"; // + añadido
import { FirstVisitNotice } from "@/components/FirstVisitNotice"; // + añadido
import SeasonalDecor from "@/components/SeasonalDecor";
import WatchSeries from "./pages/WatchSeries.tsx";
import WatchMovie from "./pages/WatchMovie.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SeasonalDecor />
        <FirstVisitNotice />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/search" element={<Search />} />
          <Route path="/admin" element={<Admin />} />

          {/* Rutas de detalle */}
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="/series/:id" element={<Series />} />
          {/* Aliases en español como pide el prompt */}
          <Route path="/pelicula/:id" element={<Movie />} />
          <Route path="/serie/:id" element={<Series />} />

          {/* Páginas de reproducción */}
          <Route path="/watch/series/:id" element={<WatchSeries />} />
          <Route path="/watch/movie/:id" element={<WatchMovie />} />

          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
