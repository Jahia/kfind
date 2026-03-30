/**
 * Checks whether the current site has augmented search enabled.
 *
 * Plain async function (not a hook) — uses `client.query()` directly.
 * Result is cached per site key at module level so repeated calls
 * (including from multiple drivers) return instantly.
 *
 * Deduplication: if two drivers call this for the same siteKey before
 * the first query resolves, only one network request is made — the
 * second caller shares the same in-flight promise via the `pending` map.
 *
 * Used by:
 * - Augmented driver: `checkAvailability → checkAugmentedAvailable(client, siteKey)`
 * - JCR pages driver: `checkAvailability → checkAugmentedAvailable(...).then(v => !v)`
 * - JCR main resources driver: same as pages
 */
import type { ApolloClientInstance } from "../types.ts";
import { SITE_INDEX_QUERY } from "./augmentedSearchQuery.ts";

const cache = new Map<string, boolean>();
const pending = new Map<string, Promise<boolean>>();

export function checkAugmentedAvailable(
  client: ApolloClientInstance,
  siteKey: string,
): Promise<boolean> {
  const cached = cache.get(siteKey);
  if (cached !== undefined) return Promise.resolve(cached);

  const inflight = pending.get(siteKey);
  if (inflight) return inflight;

  const promise = client
    .query<{ jcr: { nodeByPath: { isNodeType: boolean } } }>({
      query: SITE_INDEX_QUERY,
      variables: { path: `/sites/${siteKey}` },
      fetchPolicy: "cache-first",
    })
    .then((result) => {
      const indexed = result.data?.jcr?.nodeByPath?.isNodeType ?? false;
      cache.set(siteKey, indexed);
      pending.delete(siteKey);
      return indexed;
    })
    .catch(() => {
      cache.set(siteKey, false);
      pending.delete(siteKey);
      return false;
    });

  pending.set(siteKey, promise);
  return promise;
}
