/**
 * Generic API Transformer Utility
 * Reduces duplicate transformation logic across API endpoints
 */

/**
 * Creates a reusable transformer with bidirectional mapping functions
 * 
 * @template TApi - The API response/request type
 * @template TInternal - The internal application type
 * @param fromApi - Function to transform API type to internal type
 * @param toApi - Function to transform internal type to API type
 * @returns An object with transformation utilities for single items and lists
 * 
 * @example
 * ```typescript
 * const advertiserTransformer = createApiTransformer<ApiAdvertiser, Advertiser>(
 *   (api) => ({ id: api.id, name: api.name, blocked: api.isBlocked }),
 *   (internal) => ({ id: internal.id, name: internal.name, isBlocked: internal.blocked })
 * );
 * 
 * // Transform single item
 * const advertiser = advertiserTransformer.fromApi(apiResponse);
 * 
 * // Transform list
 * const advertisers = advertiserTransformer.fromApiList(apiResponseList);
 * ```
 */
export const createApiTransformer = <TApi, TInternal>(
  fromApi: (api: TApi) => TInternal,
  toApi: (internal: TInternal) => TApi
) => ({
  /**
   * Transform a single API response to internal format
   */
  fromApi,
  
  /**
   * Transform a single internal item to API format
   */
  toApi,
  
  /**
   * Transform a list of API responses to internal format
   */
  fromApiList: (list: TApi[]): TInternal[] => list.map(fromApi),
  
  /**
   * Transform a list of internal items to API format
   */
  toApiList: (list: TInternal[]): TApi[] => list.map(toApi),
});
