import { useState, useEffect, useCallback, useRef, type DependencyList } from 'react';

/**
 * Return type for useFetch hook
 */
export interface UseFetchReturn<T> {
  /** Fetched data */
  data: T | null;
  /** Whether fetch is in progress */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to refetch data */
  refetch: () => Promise<void>;
}

/**
 * Universal hook for API requests with loading and error states
 *
 * @template T - The type of data to fetch
 * @param fetchFn - Async function that fetches the data (receives AbortSignal as parameter)
 * @param deps - Dependencies array for re-fetching (optional)
 * @returns Object with data, loading, error states and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch(
 *   async (signal) => {
 *     const response = await fetch('/api/users', { signal });
 *     return response.json();
 *   },
 *   []
 * );
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!data) return null;
 *
 * return <div>{data.map(user => <div key={user.id}>{user.name}</div>)}</div>;
 * ```
 */
function useFetch<T>(
  fetchFn: (signal?: AbortSignal) => Promise<T>,
  deps: DependencyList = []
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const abortController = new AbortController();

    const executeFetch = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoading(true);
        setError(null);
        const result = await fetchFn(abortController.signal);

        if (isMountedRef.current && !abortController.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
          setData(null);
        }
      } finally {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(async () => {
    const abortController = new AbortController();
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      const result = await fetchFn(abortController.signal);
      if (isMountedRef.current && !abortController.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current && !abortController.signal.aborted) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        setData(null);
      }
    } finally {
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

export default useFetch;
