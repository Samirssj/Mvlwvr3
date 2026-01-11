import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { FirstVisitNotice } from "@/components/FirstVisitNotice";
import SeasonalDecor from "@/components/SeasonalDecor";

// Lazy loading de páginas para reducir bundle inicial
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Plans = lazy(() => import("./pages/Plans"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Movie = lazy(() => import("./pages/Movie"));
const Series = lazy(() => import("./pages/Series"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Search = lazy(() => import("./pages/Search"));
const Admin = lazy(() => import("./pages/Admin"));
const WatchSeries = lazy(() => import("./pages/WatchSeries"));
const WatchMovie = lazy(() => import("./pages/WatchMovie"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DeleteData = lazy(() => import("./pages/DeleteData"));

// Componente de loading para lazy loading
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
          <Route path="/" element={
            <Suspense fallback={<PageLoader />}>
              <Index />
            </Suspense>
          } />
          <Route path="/auth" element={
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          } />
          <Route path="/perfil" element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          } />
          <Route path="/plans" element={
            <Suspense fallback={<PageLoader />}>
              <Plans />
            </Suspense>
          } />
          <Route path="/catalogo" element={
            <Suspense fallback={<PageLoader />}>
              <Catalogo />
            </Suspense>
          } />
          <Route path="/search" element={
            <Suspense fallback={<PageLoader />}>
              <Search />
            </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
              <Admin />
            </Suspense>
          } />
          <Route path="/privacy" element={
            <Suspense fallback={<PageLoader />}>
              <Privacy />
            </Suspense>
          } />
          <Route path="/delete-data" element={
            <Suspense fallback={<PageLoader />}>
              <DeleteData />
            </Suspense>
          } />

          {/* Rutas de detalle */}
          <Route path="/movie/:id" element={
            <Suspense fallback={<PageLoader />}>
              <Movie />
            </Suspense>
          } />
          <Route path="/series/:id" element={
            <Suspense fallback={<PageLoader />}>
              <Series />
            </Suspense>
          } />
          {/* Aliases en español como pide el prompt */}
          <Route path="/pelicula/:id" element={
            <Suspense fallback={<PageLoader />}>
              <Movie />
            </Suspense>
          } />
          <Route path="/serie/:id" element={
            <Suspense fallback={<PageLoader />}>
              <Series />
            </Suspense>
          } />

          {/* Páginas de reproducción */}
          <Route path="/watch/series/:id" element={
            <Suspense fallback={<PageLoader />}>
              <WatchSeries />
            </Suspense>
          } />
          <Route path="/watch/movie/:id" element={
            <Suspense fallback={<PageLoader />}>
              <WatchMovie />
            </Suspense>
          } />

          {/* Checkout */}
          <Route path="/checkout" element={
            <Suspense fallback={<PageLoader />}>
              <Checkout />
            </Suspense>
          } />
          <Route path="/payment-success" element={
            <Suspense fallback={<PageLoader />}>
              <PaymentSuccess />
            </Suspense>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
