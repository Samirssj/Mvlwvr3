import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import { useSearch, type SearchResult } from '@/hooks/useSearch';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const { results, isLoading } = useSearch(query);
  const navigate = useNavigate();

  const handleSelect = (item: SearchResult) => {
    if (item.content_type === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/series/${item.id}`);
    }
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies and series..."
          className="pl-10 pr-4 py-2 w-full bg-transparent border rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        />
      </div>

      {query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card shadow-lg rounded-lg border z-10">
          <ScrollArea className="max-h-80">
            {isLoading && (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {!isLoading && results.length === 0 && query.length > 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <ul className="divide-y">
                {results.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex items-center p-3 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <img
                      src={item.image_url ?? 'https://via.placeholder.com/40x60'}
                      alt={item.title}
                      className="w-10 h-15 object-cover rounded-md mr-4"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/40x60';
                      }}
                    />
                    <span className="font-medium">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
