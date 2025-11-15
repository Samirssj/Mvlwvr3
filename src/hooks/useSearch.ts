// src/hooks/useSearch.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SearchResult = {
  id: string;
  title: string;
  image_url?: string | null;
  content_type: "movie" | "series";
};

const PAGE_SIZE = 20;

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(async (q: string, pageNum: number) => {
    if (!q.trim()) {
      setResults([]);
      setHasMore(false);
      return;
    }

    pageNum === 1 ? setIsLoading(true) : setIsLoadingMore(true);

    const from = (pageNum - 1) * PAGE_SIZE;

    const { data } = await supabase
      .from("content")
      .select("id, title, image_url, content_type")
      .ilike("title", `%${q}%`)
      .range(from, from + PAGE_SIZE - 1);

    setResults((prev) =>
      pageNum === 1 ? data || [] : [...prev, ...(data ?? [])]
    );

    setHasMore((data ?? []).length === PAGE_SIZE);

    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      search(query, 1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    search(query, next);
  }, [page, query, hasMore]);

  return { results, isLoading, isLoadingMore, hasMore, loadMore };
}
