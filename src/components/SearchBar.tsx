// src/components/SearchBar.tsx
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { useSearch, SearchResult } from "@/hooks/useSearch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const { results, isLoading, isLoadingMore, hasMore, loadMore } = useSearch(query);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore]
  );

  const handleSelect = (item: SearchResult) => {
    const path =
      item.content_type === "movie"
        ? `/watch/movie/${item.id}`
        : `/watch/series/${item.id}`;
    navigate(path);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar películas o series..."
          className="pl-10 pr-4 py-2 w-full
            bg-white/5 text-white border border-transparent
            rounded-full focus:outline-none focus:ring-2 focus:ring-[#0040ff]
            placeholder:text-gray-400"
        />
      </div>

      {query.length > 0 && (
        <div className="absolute top-full mt-2 w-full 
          bg-black/90 backdrop-blur-xl shadow-xl rounded-2xl 
          border border-white/10 overflow-hidden z-50">
          
          <ScrollArea className="max-h-[70vh]">

            {isLoading && results.length === 0 && (
              <div className="p-3 space-y-3">
                <Skeleton className="h-16 w-full rounded-md bg-white/10" />
                <Skeleton className="h-16 w-full rounded-md bg-white/10" />
                <Skeleton className="h-16 w-full rounded-md bg-white/10" />
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="p-6 text-center text-gray-300">
                No se encontraron resultados.
              </div>
            )}

            {results.length > 0 && (
              <ul className="divide-y divide-white/10">
                {results.map((item, index) => (
                  <li
                    ref={results.length === index + 1 ? lastElementRef : null}
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex items-center p-3 gap-3 cursor-pointer 
                      hover:bg-white/5 transition rounded-lg"
                  >
                    <img
                      src={item.image_url ?? "/placeholder-portrait.png"}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-md"
                    />

                    <span className="text-white font-medium truncate">
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {isLoadingMore && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
