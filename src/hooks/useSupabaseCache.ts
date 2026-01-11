import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SupabaseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const supabaseCache = new SupabaseCache();

// Hook for cached queries
export function useSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true, refetchOnWindowFocus = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchTime = useRef<number>(0);

  const fetchData = async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const cacheKey = `${key}_${JSON.stringify({})}`;

    // Try cache first (unless force refresh)
    if (!force) {
      const cachedData = supabaseCache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    // Rate limiting: don't fetch more than once per 2 seconds unless forced
    if (!force && now - lastFetchTime.current < 2000) {
      return;
    }

    setLoading(true);
    setError(null);
    lastFetchTime.current = now;

    try {
      const result = await queryFn();
      setData(result);
      supabaseCache.set(cacheKey, result, ttl);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Cleanup expired cache entries periodically
    const cleanupInterval = setInterval(() => {
      supabaseCache.cleanup();
    }, 60000); // Every minute

    return () => clearInterval(cleanupInterval);
  }, [key, enabled]);

  useEffect(() => {
    if (refetchOnWindowFocus) {
      const handleFocus = () => fetchData(true);
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, key]);

  const refetch = () => fetchData(true);

  return { data, loading, error, refetch };
}

// Optimized content fetching functions
export const contentQueries = {
  // Fetch new releases with caching
  fetchNewReleases: () => 
    supabase
      .from("content")
      .select("*")
      .eq("is_new", true)
      .order("created_at", { ascending: false })
      .limit(6),

  // Fetch recently added content (last 15 days)
  fetchRecentlyAdded: () => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    return supabase
      .from("content")
      .select("*")
      .gte('created_at', fifteenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(12);
  },

  // Fetch movies with pagination
  fetchMovies: (page: number = 0, limit: number = 12) =>
    supabase
      .from("content")
      .select("*")
      .eq("content_type", "movie")
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1),

  // Fetch series with pagination
  fetchSeries: (page: number = 0, limit: number = 12) =>
    supabase
      .from("content")
      .select("*")
      .eq("content_type", "series")
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1),

  // Fetch content by genre
  fetchByGenre: (genre: string, contentType: "movie" | "series") =>
    supabase
      .from("content")
      .select("*")
      .contains("genres", [genre])
      .eq("content_type", contentType)
      .order("created_at", { ascending: false })
      .limit(12),

  // Fetch watch progress for user
  fetchWatchProgress: (userId: string) =>
    supabase
      .from("watch_progress")
      .select("content:content_id(id,title,image_url,content_type,is_premium,is_new), progress_seconds, last_watched_at")
      .eq("user_id", userId)
      .order("last_watched_at", { ascending: false })
      .limit(24),
};
