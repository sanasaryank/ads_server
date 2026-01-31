import { useState, useEffect, useCallback, type DependencyList } from 'react';

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
 * @param fetchFn - Async function that fetches the data
 * @param deps - Dependencies array for re-fetching (optional)
 * @returns Object with data, loading, error states and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch(
 *   async () => {
 *     const response = await fetch('/api/users');
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
  fetchFn: () => Promise<T>,
  deps: DependencyList = []
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const executeFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();

        if (!abortController.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
          setData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

export default useFetch;
