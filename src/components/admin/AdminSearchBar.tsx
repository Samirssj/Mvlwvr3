import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type SearchResult = {
  id: string;
  title: string;
  image_url?: string | null;
  content_type: "movie" | "series";
};

interface AdminSearchBarProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AdminSearchBar: React.FC<AdminSearchBarProps> = ({ onEdit, onDelete }) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const searchTimeout = useRef<NodeJS.Timeout>();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, image_url, content_type")
        .ilike("title", `%${q}%`)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    const timer = setTimeout(() => {
      search(query);
    }, 300);

    searchTimeout.current = timer;

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, search]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar contenido..."
          className="pl-10 pr-4 py-2 w-full bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
        />
      </div>

      {query.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-gray-900/95 backdrop-blur-xl shadow-xl rounded-lg border border-white/10 overflow-hidden z-50">
          <ScrollArea className="max-h-[60vh]">
            {isLoading && results.length === 0 ? (
              <div className="p-3 space-y-3">
                <Skeleton className="h-16 w-full rounded-md bg-white/10" />
                <Skeleton className="h-16 w-full rounded-md bg-white/10" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-gray-300">
                No se encontraron resultados.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {results.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={item.image_url || "/placeholder-portrait.png"}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <span className="text-white font-medium truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                        {item.content_type === "movie" ? "Película" : "Serie"}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item.id);
                          setQuery("");
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                          setQuery("");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
