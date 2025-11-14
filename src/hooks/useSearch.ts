import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Tables } from '@/integrations/supabase/types';

export type SearchResult = Pick<Tables<'content'>, 'id' | 'title' | 'image_url' | 'content_type'>;

const PAGE_SIZE = 20;

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const search = useCallback(async (currentQuery: string, currentPage: number) => {
    if (currentQuery.trim().length < 1) {
      setResults([]);
      setHasMore(false);
      return;
    }

    if (currentPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const from = (currentPage - 1) * PAGE_SIZE;
    
    const { data, error } = await supabase
      .from('content')
      .select('id, title, image_url, content_type')
      .ilike('title', `%${currentQuery}%`)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching search results:', error);
      setResults([]);
      setHasMore(false);
    } else {
      setResults(prev => (currentPage === 1 ? (data ?? []) : [...prev, ...(data ?? [])]));
      setHasMore((data ?? []).length === PAGE_SIZE);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    setPage(1);
    const debounceTimeout = setTimeout(() => {
      search(query, 1);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query, search]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    search(query, nextPage);
  }, [isLoading, isLoadingMore, hasMore, page, query, search]);

  return { results, isLoading, isLoadingMore, hasMore, loadMore };
}
