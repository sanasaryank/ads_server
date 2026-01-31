import useFetch, { type UseFetchReturn } from './useFetch';
import { type AuditEvent, type AuditEntityType } from '../types';

/**
 * Props for useAuditLog hook
 */
export interface UseAuditLogProps {
  /** Filter by entity type */
  entityType?: AuditEntityType;
  /** Filter by entity ID */
  entityId?: number | string;
}

/**
 * Return type for useAuditLog hook
 */
export interface UseAuditLogReturn {
  /** Audit events array */
  events: AuditEvent[];
  /** Whether data is loading */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to refetch events */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching audit log events with optional filters
 *
 * @param props - Filter options
 * @returns Object with events, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Fetch all audit events
 * const { events, loading, error } = useAuditLog({});
 *
 * // Fetch audit events for specific entity
 * const { events, loading, error } = useAuditLog({
 *   entityType: 'restaurant',
 *   entityId: 123,
 * });
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {events.map(event => (
 *       <div key={event.id}>
 *         {event.actorName} {event.action} {event.entityLabel}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
function useAuditLog({
  entityType,
  entityId,
}: UseAuditLogProps): UseAuditLogReturn {
  const fetchEvents = async (): Promise<AuditEvent[]> => {
    // Build query params
    const params = new URLSearchParams();
    if (entityType) {
      params.append('entityType', entityType);
    }
    if (entityId !== undefined) {
      params.append('entityId', String(entityId));
    }

    const queryString = params.toString();
    const url = `/api/audit${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch audit events');
    }

    const data = await response.json();
    return data.data || [];
  };

  const { data, loading, error, refetch }: UseFetchReturn<AuditEvent[]> = useFetch(
    fetchEvents,
    [entityType, entityId]
  );

  return {
    events: data || [],
    loading,
    error,
    refetch,
  };
}

export default useAuditLog;
