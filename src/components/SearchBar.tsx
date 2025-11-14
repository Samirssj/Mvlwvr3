import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useSearch, type SearchResult } from '@/hooks/useSearch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const { results, isLoading, isLoadingMore, hasMore, loadMore } = useSearch(query);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  const handleSelect = (item: SearchResult) => {
    const path = item.content_type === 'movie' ? `/watch/movie/${item.id}` : `/watch/series/${item.id}`;
    navigate(path);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar películas, series y más..."
          className="pl-12 pr-4 h-12 w-full bg-background/80 backdrop-blur-sm border-2 border-primary/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
        />
      </div>

      {query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background/90 backdrop-blur-lg shadow-2xl rounded-2xl border border-border/20 z-10 overflow-hidden">
          <ScrollArea className="max-h-[70vh] sm:max-h-[60vh]">
            {isLoading && results.length === 0 && (
              <div className="p-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 space-x-4">
                        <Skeleton className="h-16 w-12 rounded-md" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                ))}
              </div>
            )}

            {!isLoading && results.length === 0 && query.length > 0 && (
              <div className="p-16 text-center text-lg text-muted-foreground">
                No se encontraron resultados.
              </div>
            )}

            {results.length > 0 && (
              <ul className="divide-y divide-border/20">
                {results.map((item, index) => (
                  <li
                    ref={results.length === index + 1 ? lastElementRef : null}
                    key={`${item.id}-${index}`}
                    onClick={() => handleSelect(item)}
                    className="flex items-center p-3 hover:bg-primary/10 cursor-pointer transition-colors duration-200 ease-in-out group"
                  >
                    <img
                      src={item.image_url ?? 'https://via.placeholder.com/48x72'}
                      alt={item.title}
                      className="w-12 h-[72px] object-cover rounded-md mr-4 shadow-md group-hover:scale-105 transform transition-transform duration-300"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/48x72'; }}
                    />
                    <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-200">
                      {item.title}
                    </span>
                  </li>
                ))}
                 {isLoadingMore && 
                    <div className="flex justify-center items-center p-4">
                       <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                 }
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
