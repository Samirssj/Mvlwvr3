import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Tables } from '@/integrations/supabase/types';

export type SearchResult = Pick<Tables<'content'>, 'id' | 'title' | 'image_url' | 'content_type'>;

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from('content')
        .select('id, title, image_url, content_type')
        .ilike('title', `%${query}%`)
        .limit(10);


      if (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
      setIsLoading(false);
    };

    const debounceTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  return { results, isLoading };
}
