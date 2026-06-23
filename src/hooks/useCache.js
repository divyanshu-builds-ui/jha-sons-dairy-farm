import { useState, useEffect, useRef } from 'react';

// In-memory cache (persists across page navigations within session)
const cache = {};

/**
 * useCache - Stale-while-revalidate pattern
 * First visit: loading=true, shows skeleton
 * Return visit: instantly shows cached data, refreshes in background
 */
export function useCache(key, fetchFn, deps = []) {
  const [data, setData] = useState(cache[key]?.data ?? null);
  const [loading, setLoading] = useState(!cache[key]);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // If no cache, show loading
      if (!cache[key]) setLoading(true);

      try {
        const result = await fetchRef.current();
        if (!cancelled) {
          cache[key] = { data: result, ts: Date.now() };
          setData(result);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, deps);

  const refresh = async () => {
    try {
      const result = await fetchRef.current();
      cache[key] = { data: result, ts: Date.now() };
      setData(result);
    } catch (e) {}
  };

  return { data, loading, refresh };
}

// Clear specific cache or all
export function clearCache(key) {
  if (key) delete cache[key];
  else Object.keys(cache).forEach(k => delete cache[k]);
}
