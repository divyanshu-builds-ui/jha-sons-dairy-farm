import { useState, useEffect, useRef, useCallback } from 'react';
import { cachedGetDocs, getCachedDocs } from '../services/firebase';

/**
 * useLiveData - Stale-While-Revalidate hook
 *
 * 1. Instantly returns cached data (fast page switch)
 * 2. Fetches fresh data in background
 * 3. Updates silently when fresh data arrives
 *
 * Usage:
 *   const { data, loading, refresh } = useLiveData(
 *     () => query(collection(db, 'orders'), where('phone', '==', phone)),
 *     `orders_${phone}`,
 *     { ttl: 2 * 60 * 1000 } // 2 min
 *   );
 */
export function useLiveData(queryFn, cacheKey, options = {}) {
  const { ttl = 3 * 60 * 1000, enabled = true } = options;

  const [docs, setDocs] = useState(() => {
    // Instantly load from cache on mount
    const cached = getCachedDocs(cacheKey);
    return cached ? cached.docs.map(d => ({ id: d.id, ...d.data() })) : null;
  });
  const [loading, setLoading] = useState(!getCachedDocs(cacheKey));
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  const fetch = useCallback(async (silent = false) => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const snap = await cachedGetDocs(queryFn(), cacheKey, silent ? 0 : ttl);
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [cacheKey, enabled, ttl]);

  useEffect(() => {
    if (!enabled) return;
    const cached = getCachedDocs(cacheKey);
    if (cached) {
      // Has cache - show instantly, revalidate in background
      fetch(true);
    } else {
      // No cache - show loading
      fetch(false);
    }
  }, [cacheKey, enabled]);

  const refresh = useCallback(() => fetch(false), [fetch]);

  return { data: docs || [], loading, error, refresh };
}

/**
 * usePageData - Simple cached fetch, no background revalidation
 * For data that doesn't change often (products, settings)
 */
export function usePageData(fetchFn, deps = [], ttl = 10 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchFn();
        if (!cancelled) { setData(result); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, deps);

  return { data, loading };
}
